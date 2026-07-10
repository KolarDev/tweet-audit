import "dotenv/config";

import { GeminiClient } from "./gemini";
import { MockGeminiClient } from "./mock-gemini";

import { ArchiveParser } from "./parser/archive-parser";
import { ConfigLoader } from "./config/config-loader";
import { PromptBuilder } from "./config/prompt-builder";

const USE_MOCK = true;

async function main() {
  const config = await new ConfigLoader().load();

  const parser = new ArchiveParser();

  const ai = USE_MOCK
    ? new MockGeminiClient()
    : new GeminiClient();

  const promptBuilder = new PromptBuilder();

  const tweets = await parser.loadTweets();

  console.log(`Loaded ${tweets.length} tweets`);

  for (const tweet of tweets) {
    const prompt = promptBuilder.build(tweet.text, config);

    const analysis = await ai.analyze(prompt);

    console.log({
      id: tweet.id,
      analysis,
    });

    // We'll move this into AuditProcessor in Stage 4
  }
}

main();