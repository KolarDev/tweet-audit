import "dotenv/config";

import { GeminiClient } from "./gemini";
import { MockGeminiClient } from "./mock-gemini";
import { writeFlaggedTweet } from "./writer";

const USE_MOCK = true;

const ai = USE_MOCK
  ? new MockGeminiClient()
  : new GeminiClient();

const tweets = [
  {
    id: "1",
    text: "Bitcoin is the future",
  },
  {
    id: "2",
    text: "I love TypeScript",
  },
];

async function main() {
  for (const tweet of tweets) {
    const analysis = await ai.analyzeTweet(tweet.text);

    if (analysis.flag) {
      writeFlaggedTweet(
        `https://x.com/me/status/${tweet.id}`
      );
    }

    console.log(tweet.id);
    console.log(analysis);
  }
}

main();