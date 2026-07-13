import { AIClient } from "../ai";
import { PromptBuilder } from "../config/prompt-builder";
import { ArchiveParser } from "../parser/archive-parser";
import { AuditConfig } from "../types/config";
import { FlaggedTweet } from "../types/flagged-tweet";
import { Tweet } from "../types/tweet";
import { Writer } from "../writer/writer";

export class AuditProcessor {
  constructor(
    private readonly parser: ArchiveParser,
    private readonly promptBuilder: PromptBuilder,
    private readonly ai: AIClient,
    private readonly writer: Writer,
    private readonly config: AuditConfig
  ) {}

  private toFlaggedTweet(tweet: Tweet): FlaggedTweet {
    return {
        tweetUrl: tweet.url,
        deleted: false,
    };
  }

  async run(): Promise<void> {
    const tweets = await this.parser.loadTweets();

    console.log(`Loaded ${tweets.length} tweets`);

    for (const tweet of tweets) {
      try {
        const prompt = this.promptBuilder.build(
          tweet.text,
          this.config
        );

        const analysis = await this.ai.analyze(prompt);

        if (analysis.flag) {
          await this.writer.write(
            this.toFlaggedTweet(tweet)
          );
        }

        console.info({
          id: tweet.id,
          flagged: analysis.flag,
          reason: analysis.reason,
        });
      } catch (error) {
        console.error(
          `Failed to process tweet ${tweet.id}:`,
          error
        );

        continue;
      }
    }
  }
}