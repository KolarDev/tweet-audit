import fs from "node:fs/promises";

import { PATHS } from "../config/paths";
import { ArchiveTweet } from "../types/archive-tweet";
import { Tweet } from "../types/tweet";

export class ArchiveParser {

  private async ensureArchiveExists() {
      try {
          await fs.access(PATHS.tweets);
      } catch {
          throw new Error(
              `Could not find X archive.
              Expected: ${PATHS.tweets}
              Extract your X archive into the project's archive folder.`
          );
      }
  }
  async loadTweets(): Promise<Tweet[]> {
    await this.ensureArchiveExists();
    const file = await fs.readFile(PATHS.tweets, "utf8");

    const equalIndex = file.indexOf("=");

    if (equalIndex === -1) {
      throw new Error("Invalid Twitter archive.");
    }

    const json = file.substring(equalIndex + 1).trim();

    const archiveTweets: ArchiveTweet[] = JSON.parse(json);

    return archiveTweets.map(({ tweet }) => ({
      id: tweet.id,
      text: tweet.full_text,
      createdAt: new Date(tweet.created_at),
      url: `https://x.com/i/web/status/${tweet.id}`,
    }));
  }
}