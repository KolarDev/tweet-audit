import "dotenv/config";

import { GeminiClient } from "./gemini";
import { MockGeminiClient } from "./mock-gemini";
import { ArchiveParser } from "./parser/archive-parser";
import { writeFlaggedTweet } from "./writer";

const USE_MOCK = true;

const ai = USE_MOCK
  ? new MockGeminiClient()
  : new GeminiClient();

const parser = new ArchiveParser();

async function main() {
  const tweets = await parser.loadTweets();

  console.log(`Loaded ${tweets.length} tweets`);
  console.log(tweets.slice(0, 5));

  // for (const tweet of tweets) {
  //   const analysis = await ai.analyzeTweet(tweet.text);

  //   if (analysis.flag) {
  //     writeFlaggedTweet(tweet.url);
  //   }

  //   console.log(tweet.id);
  //   console.log(analysis);
  // }
}

main();