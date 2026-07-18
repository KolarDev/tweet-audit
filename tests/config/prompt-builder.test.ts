import { describe, expect, it } from "vitest";
import { PromptBuilder } from "../../src/config/prompt-builder";

describe("PromptBuilder", () => {
  it("builds a prompt from tweet and config", () => {
    const builder = new PromptBuilder();

    const config = {
      criteria: {
        forbiddenWords: ["crypto", "NFT"],
        professionalCheck: true,
        excludePolitics: true,
        tone: "professional",
      },
      processing: {
        requestsPerSecond: 20,
        checkpointInterval: 50,
      },
    };

    const prompt = builder.build(
      "Bitcoin is the future",
      config
    );

    expect(prompt).toContain("crypto");
    expect(prompt).toContain("NFT");
    expect(prompt).toContain("Bitcoin is the future");
    expect(prompt).toContain("professional");
  });
});