import { AppError } from "./app-error";

export class InvalidGeminiResponseError extends AppError {
  constructor() {
    super(
      "Gemini returned an invalid JSON response.",
      false
    );
  }
}