import fs from "node:fs/promises";

import { PATHS } from "../config/paths";
import {
  ArchiveNotFoundError,
  InvalidArchiveError,
} from "../errors/archive-errors";
import { ArchiveTweet } from "../types/archive-tweet";
import { Tweet } from "../types/tweet";

export class ArchiveParser {
  private async ensureArchiveExists(): Promise<void> {
    try {
      await fs.access(PATHS.tweets);
    } catch {
      throw new ArchiveNotFoundError(PATHS.tweets);
    }
  }

  async loadTweets(): Promise<Tweet[]> {
    await this.ensureArchiveExists();

    const file = await fs.readFile(PATHS.tweets, "utf8");

    const equalIndex = file.indexOf("=");

    if (equalIndex === -1) {
      throw new InvalidArchiveError();
    }

    const json = file.substring(equalIndex + 1).trim();

    let archiveTweets: ArchiveTweet[];

    try {
      archiveTweets = JSON.parse(json);
    } catch {
      throw new InvalidArchiveError();
    }

    return archiveTweets.map(({ tweet }) => ({
      id: tweet.id,
      text: tweet.full_text,
      createdAt: new Date(tweet.created_at),
      url: `https://x.com/i/web/status/${tweet.id}`,
    }));
  }
}