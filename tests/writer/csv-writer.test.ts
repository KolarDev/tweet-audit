import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";

import { CsvWriter } from "../../src/writer/csv-writer";
import { CsvWriteError } from "../../src/errors/writer-errors";

vi.mock("node:fs/promises", () => ({
  default: {
    access: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
  },
}));

describe("CsvWriter", () => {
  const writer = new CsvWriter();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the csv file if it does not exist", async () => {
    vi.mocked(fs.access).mockRejectedValueOnce(new Error());

    await writer.write({
      tweetUrl: "https://x.com/test/status/1",
      deleted: false,
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      "tweet_url,deleted\n"
    );

    expect(fs.appendFile).toHaveBeenCalledWith(
      expect.any(String),
      "https://x.com/test/status/1,false\n"
    );
  });

  it("appends to an existing csv file", async () => {
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);

    await writer.write({
      tweetUrl: "https://x.com/test/status/2",
      deleted: false,
    });

    expect(fs.writeFile).not.toHaveBeenCalled();

    expect(fs.appendFile).toHaveBeenCalledWith(
      expect.any(String),
      "https://x.com/test/status/2,false\n"
    );
  });

  it("throws CsvWriteError when writing fails", async () => {
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);

    vi.mocked(fs.appendFile).mockRejectedValueOnce(
      new Error("Disk full")
    );

    await expect(
      writer.write({
        tweetUrl: "https://x.com/test/status/3",
        deleted: false,
      })
    ).rejects.toBeInstanceOf(CsvWriteError);
  });
});