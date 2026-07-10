import fs from "node:fs/promises";
import path from "node:path";

import { Writer } from "./writer";
import { FlaggedTweet } from "../types/flagged-tweet";

export class CsvWriter implements Writer {
  private readonly filePath = path.resolve("flagged.csv");

  async write(tweet: FlaggedTweet): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(
        this.filePath,
        "tweet_url,deleted\n"
      );
    }

    await fs.appendFile(
      this.filePath,
      `${tweet.tweetUrl},${tweet.deleted}\n`
    );
  }
}