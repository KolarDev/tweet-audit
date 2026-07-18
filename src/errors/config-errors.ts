import { AppError } from "./app-error";

export class ConfigNotFoundError extends AppError {
  constructor(path: string) {
    super(`Config file not found: ${path}`, false);
  }
}

export class InvalidConfigError extends AppError {
  constructor() {
    super("Config file contains invalid JSON.", false);
  }
}