import "dotenv/config";

import { ConfigLoader } from "./config/config-loader";
import { PromptBuilder } from "./config/prompt-builder";

import { GeminiClient } from "./gemini";
import { MockGeminiClient } from "./mock-gemini";

import { ArchiveParser } from "./parser/archive-parser";
import { AuditProcessor } from "./processor/audit-processor";
import { CsvWriter } from "./writer/csv-writer";

const USE_MOCK = true;

async function main() {
  const config = await new ConfigLoader().load();

  const processor = new AuditProcessor(
    new ArchiveParser(),
    new PromptBuilder(),
    USE_MOCK
      ? new MockGeminiClient()
      : new GeminiClient(),
    new CsvWriter(),
    config
  );

  await processor.run();
}

main();