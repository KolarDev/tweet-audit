import { beforeEach, describe, expect, it, vi } from "vitest";
import { retry } from "../../src/utils/retry";

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("retry()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns immediately when operation succeeds", async () => {
    const operation = vi.fn().mockResolvedValue("hello");

    const result = await retry(operation, {
      attempts: 3,
      delay: 0,
      shouldRetry: () => true,
      logger,
    });

    expect(result).toBe("hello");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("retries until success", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue("done");

    const result = await retry(operation, {
      attempts: 3,
      delay: 0,
      shouldRetry: () => true,
      logger,
    });

    expect(result).toBe("done");
    expect(operation).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("does not retry unrecoverable errors", async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(new Error("bad"));

    await expect(
      retry(operation, {
        attempts: 3,
        delay: 0,
        shouldRetry: () => false,
        logger,
      })
    ).rejects.toThrow("bad");

    expect(operation).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});