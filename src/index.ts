import "dotenv/config";

import { ConfigLoader } from "./config/config-loader";
import { PromptBuilder } from "./config/prompt-builder";

import { GeminiClient } from "./gemini";
import { MockGeminiClient } from "./mock-gemini";

import { ArchiveParser } from "./parser/archive-parser";
import { AuditProcessor } from "./processor/audit-processor";
import { CsvWriter } from "./writer/csv-writer";
import { CheckpointStore } from "./checkpoint/checkpoint-store";
import { AppError } from "./errors/app-error";
import { ConsoleLogger } from "./logger/console-logger";

const USE_MOCK = process.env.USE_MOCK === "true";

async function main() {
  try {
    const config = await new ConfigLoader().load();

    const processor = new AuditProcessor(
      new ArchiveParser(),
      new PromptBuilder(),
      USE_MOCK
        ? new MockGeminiClient()
        : new GeminiClient(),
      new CsvWriter(),
      new CheckpointStore(),
      config,
      new ConsoleLogger()
    );

    let shuttingDown = false;

    async function gracefulShutdown(signal: string) {
      if (shuttingDown) return;

      shuttingDown = true;

      console.log(`\nReceived ${signal}`);

      await processor.shutdown();

      process.exit(0);
    }

    process.on("SIGINT", () => {
      void gracefulShutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void gracefulShutdown("SIGTERM");
    });

    await processor.run();
  } catch (error) {
    if (error instanceof AppError) {
      console.error(error.message);
      process.exit(1);
    }

    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

main();
