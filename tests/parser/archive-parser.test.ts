import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  default: {
    access: vi.fn(),
    readFile: vi.fn(),
  },
}));

import fs from "node:fs/promises";

import { ArchiveParser } from "../../src/parser/archive-parser";
import {
  ArchiveNotFoundError,
  InvalidArchiveError,
} from "../../src/errors/archive-errors";

describe("ArchiveParser", () => {
  const parser = new ArchiveParser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses tweets correctly", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    vi.mocked(fs.readFile).mockResolvedValue(`
window.YTD.tweets.part0 = [
  {
    "tweet": {
      "id":"1",
      "id_str":"1",
      "full_text":"Hello",
      "created_at":"Wed Jul 01 2026",
      "lang":"en",
      "retweeted":false,
      "favorited":false
    }
  }
]
`);

    const tweets = await parser.loadTweets();

    expect(tweets).toHaveLength(1);
    expect(tweets[0].id).toBe("1");
    expect(tweets[0].text).toBe("Hello");
  });

  it("throws ArchiveNotFoundError", async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error());

    await expect(
      parser.loadTweets()
    ).rejects.toBeInstanceOf(ArchiveNotFoundError);
  });

  it("throws InvalidArchiveError", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    vi.mocked(fs.readFile).mockResolvedValue(
      "not valid"
    );

    await expect(
      parser.loadTweets()
    ).rejects.toBeInstanceOf(
      InvalidArchiveError
    );
  });
});