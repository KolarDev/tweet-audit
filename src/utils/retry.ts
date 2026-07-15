import { Logger } from "../logger/logger";

export interface RetryOptions {
  attempts: number;
  delay: number;
  shouldRetry(error: unknown): boolean;
  logger: Logger;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    attempts,
    delay,
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

      const waitTime =
        delay * Math.pow(2, attempt - 1);

      logger.warn(
        `Retrying (${attempt}/${attempts}) in ${waitTime}ms...`
      );

      await sleep(waitTime);
    }
  }

  throw lastError;
}