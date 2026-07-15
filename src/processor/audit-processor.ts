import { AIClient } from "../ai";
import { PromptBuilder } from "../config/prompt-builder";
import { Logger } from "../logger/logger";
import { ArchiveParser } from "../parser/archive-parser";
import { AuditConfig } from "../types/config";
import { FlaggedTweet } from "../types/flagged-tweet";
import { Tweet } from "../types/tweet";
import { retry } from "../utils/retry";
import { shouldRetry } from "../utils/should-retry";
import { Writer } from "../writer/writer";

export class AuditProcessor {
  private readonly stats = {
    processed: 0,
    flagged: 0,
    failed: 0,
  };

  constructor(
    private readonly parser: ArchiveParser,
    private readonly promptBuilder: PromptBuilder,
    private readonly ai: AIClient,
    private readonly writer: Writer,
    private readonly config: AuditConfig,
    private readonly logger: Logger
  ) {}

  private toFlaggedTweet(tweet: Tweet): FlaggedTweet {
    return {
      tweetUrl: tweet.url,
      deleted: false,
    };
  }

  async run(): Promise<void> {
    const tweets = await this.parser.loadTweets();

    this.logger.info(
      `Loaded ${tweets.length} tweets`
    );

    for (const tweet of tweets) {
      this.logger.info(
        `Processing tweet ${this.stats.processed + 1}/${tweets.length}`
      );

      try {
        const prompt = this.promptBuilder.build(
          tweet.text,
          this.config
        );

        const analysis = await retry(
          () => this.ai.analyze(prompt),
          {
            attempts: 3,
            delay: 1000,
            shouldRetry,
            logger: this.logger,
          }
        );

        this.stats.processed++;

        if (analysis.flag) {
          await this.writer.write(
            this.toFlaggedTweet(tweet)
          );

          this.stats.flagged++;

          this.logger.info(
            `Flagged tweet ${tweet.id}`
          );
        }

        this.logger.info(
          `Processed tweet ${tweet.id}`
        );
      } catch (error) {
        this.stats.failed++;

        this.logger.error(
          `Failed to process tweet ${tweet.id}`
        );

        this.logger.error(String(error));

        continue;
      }
    }

    this.logger.info("");
    this.logger.info("Audit Complete");
    this.logger.info(
      `Processed : ${this.stats.processed}`
    );
    this.logger.info(
      `Flagged   : ${this.stats.flagged}`
    );
    this.logger.info(
      `Failed    : ${this.stats.failed}`
    );
  }
}