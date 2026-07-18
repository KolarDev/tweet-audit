import { AppError } from "./app-error";

export class CsvWriteError extends AppError {
  constructor() {
    super(
      "Failed to write flagged tweets to CSV.",
      true
    );
  }
}