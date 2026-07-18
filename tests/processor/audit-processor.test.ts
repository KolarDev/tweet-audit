import { describe, expect, it, vi } from "vitest";

import { AuditProcessor } from "../../src/processor/audit-processor";
import { PromptBuilder } from "../../src/config/prompt-builder";

describe("AuditProcessor", () => {
  const config = {
    criteria: {
      forbiddenWords: [],
      professionalCheck: true,
      excludePolitics: false,
      tone: "professional",
    },
    processing: {
      requestsPerSecond: 100000,
      checkpointInterval: 1,
    },
  };

  function createDependencies(flag = true) {
    const parser = {
      loadTweets: vi.fn().mockResolvedValue([
        {
          id: "1",
          text: "hello",
          createdAt: new Date(),
          url: "url",
        },
      ]),
    };

    const ai = {
      analyze: vi.fn().mockResolvedValue({
        flag,
        reason: "reason",
      }),
    };

    const writer = {
      write: vi.fn(),
    };

    const checkpoint = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
      clear: vi.fn(),
    };

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    return {
      parser,
      ai,
      writer,
      checkpoint,
      logger,
    };
  }

  it("writes flagged tweets", async () => {
    const deps = createDependencies(true);

    const processor = new AuditProcessor(
      deps.parser as any,
      new PromptBuilder(),
      deps.ai as any,
      deps.writer as any,
      deps.checkpoint as any,
      config,
      deps.logger
    );

    await processor.run();

    expect(deps.writer.write).toHaveBeenCalledTimes(1);
  });

  it("does not write clean tweets", async () => {
    const deps = createDependencies(false);

    const processor = new AuditProcessor(
      deps.parser as any,
      new PromptBuilder(),
      deps.ai as any,
      deps.writer as any,
      deps.checkpoint as any,
      config,
      deps.logger
    );

    await processor.run();

    expect(deps.writer.write).not.toHaveBeenCalled();
  });

  it("saves checkpoint", async () => {
    const deps = createDependencies();

    const processor = new AuditProcessor(
      deps.parser as any,
      new PromptBuilder(),
      deps.ai as any,
      deps.writer as any,
      deps.checkpoint as any,
      config,
      deps.logger
    );

    await processor.run();

    expect(deps.checkpoint.save).toHaveBeenCalled();
  });

  it("clears checkpoint after successful audit", async () => {
    const deps = createDependencies();

    const processor = new AuditProcessor(
      deps.parser as any,
      new PromptBuilder(),
      deps.ai as any,
      deps.writer as any,
      deps.checkpoint as any,
      config,
      deps.logger
    );

    await processor.run();

    expect(deps.checkpoint.clear).toHaveBeenCalledTimes(1);
  });

  it("continues when AI throws", async () => {
    const deps = createDependencies();

    deps.ai.analyze.mockRejectedValue(
      new Error("Gemini failed")
    );

    const processor = new AuditProcessor(
      deps.parser as any,
      new PromptBuilder(),
      deps.ai as any,
      deps.writer as any,
      deps.checkpoint as any,
      config,
      deps.logger
    );

    await processor.run();

    expect(deps.logger.error).toHaveBeenCalled();
  });

  it("resumes from checkpoint", async () => {
    const deps = createDependencies();

    deps.parser.loadTweets.mockResolvedValue([
      {
        id: "1",
        text: "one",
        createdAt: new Date(),
        url: "1",
      },
      {
        id: "2",
        text: "two",
        createdAt: new Date(),
        url: "2",
      },
      {
        id: "3",
        text: "three",
        createdAt: new Date(),
        url: "3",
      },
    ]);

    deps.checkpoint.load.mockResolvedValue({
      lastProcessedIndex: 1,
      stats: {
        processed: 2,
        flagged: 0,
        failed: 0,
      },
      updatedAt: "",
    });

    const processor = new AuditProcessor(
      deps.parser as any,
      new PromptBuilder(),
      deps.ai as any,
      deps.writer as any,
      deps.checkpoint as any,
      config,
      deps.logger
    );

    await processor.run();

    expect(deps.ai.analyze).toHaveBeenCalledTimes(1);
  });
});