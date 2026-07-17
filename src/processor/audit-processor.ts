import { AIClient } from "../ai";
import { CheckpointStore } from "../checkpoint/checkpoint-store";
import { PromptBuilder } from "../config/prompt-builder";
import { Logger } from "../logger/logger";
import { RateLimiter } from "../limiter/rate-limiter";
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

  private readonly checkpointInterval = 25;
  private readonly rateLimiter = new RateLimiter(500);

  private currentIndex = 0;
  private completed = false;

  constructor(
    private readonly parser: ArchiveParser,
    private readonly promptBuilder: PromptBuilder,
    private readonly ai: AIClient,
    private readonly writer: Writer,
    private readonly checkpointStore: CheckpointStore,
    private readonly config: AuditConfig,
    private readonly logger: Logger
  ) {}

  private toFlaggedTweet(tweet: Tweet): FlaggedTweet {
    return {
      tweetUrl: tweet.url,
      deleted: false,
    };
  }

  private async saveCheckpoint(): Promise<void> {
    await this.checkpointStore.save({
      lastProcessedIndex: this.currentIndex,
      stats: {
        processed: this.stats.processed,
        flagged: this.stats.flagged,
        failed: this.stats.failed,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  async shutdown(): Promise<void> {
    if (this.completed) return;

    this.logger.warn(
      "Shutdown requested. Saving checkpoint..."
    );

    try {
      await this.saveCheckpoint();
      this.logger.info(
        "Checkpoint saved successfully."
      );
    } catch (error) {
      this.logger.error(
        "Failed to save checkpoint during shutdown."
      );
      this.logger.error(String(error));
    }
  }

  async run(): Promise<void> {
    const tweets = await this.parser.loadTweets();

    this.logger.info(
      `Loaded ${tweets.length} tweets`
    );

    const checkpoint =
      await this.checkpointStore.load();

    let startIndex = 0;

    if (checkpoint) {
      startIndex =
        checkpoint.lastProcessedIndex + 1;

      this.stats.processed =
        checkpoint.stats.processed;
      this.stats.flagged =
        checkpoint.stats.flagged;
      this.stats.failed =
        checkpoint.stats.failed;

      this.logger.info(
        `Checkpoint found. Resuming from tweet ${
          startIndex + 1
        }.`
      );
    } else {
      this.logger.info(
        "No checkpoint found. Starting new audit."
      );
    }

    for (let index = startIndex; index < tweets.length; index++) {
      const tweet = tweets[index];

      this.currentIndex = index;

      const progress = ((index + 1) / tweets.length * 100).toFixed(1);

      this.logger.info(
        `[${progress}%] Processing ${index + 1}/${tweets.length} | Flagged: ${this.stats.flagged} | Failed: ${this.stats.failed}`
      );

      try {
        await this.rateLimiter.wait();

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

        if (
          this.stats.processed %
          this.checkpointInterval === 0
        ) {
          try {
            await this.saveCheckpoint();

            this.logger.info(
              `Checkpoint saved at tweet ${index + 1}`
            );
          } catch (error) {
            this.logger.warn(
              "Failed to save checkpoint."
            );
            this.logger.warn(String(error));
          }
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
      }
    }

    this.completed = true;

    await this.checkpointStore.clear();

    this.logger.info("Checkpoint cleared.");
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