import { Logger } from "./logger";

export class ConsoleLogger implements Logger {
  info(message: string): void {
    console.info(`[INFO] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}