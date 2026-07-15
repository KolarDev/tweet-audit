import { AppError } from "../errors/app-error";

export function shouldRetry(
  error: unknown
): boolean {
  return (
    error instanceof AppError &&
    error.recoverable
  );
}