import { Logger } from "../logger/logger";

export interface RetryOptions {
  attempts: number;
  delay: number;
  maxDelay?: number;
  shouldRetry(error: unknown): boolean;
  logger: Logger;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(
  baseDelay: number,
  attempt: number,
  maxDelay: number
): number {
  const exponential =
    baseDelay * Math.pow(2, attempt - 1);

  const capped = Math.min(exponential, maxDelay);

  return Math.floor(Math.random() * capped);
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    attempts,
    delay,
    maxDelay = 30000,
    shouldRetry,
    logger,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error)) {
        throw error;
      }

      if (attempt === attempts) {
        break;
      }

      const waitTime = calculateDelay(
        delay,
        attempt,
        maxDelay
      );

      logger.warn(
        `Retry ${attempt}/${attempts}. Waiting ${waitTime}ms...`
      );

      await sleep(waitTime);
    }
  }

  throw lastError;
}