import { AppError } from "./app-error";

export class GeminiTimeoutError extends AppError {
  constructor() {
    super("Gemini request timed out.", true);
  }
}

export class GeminiRateLimitError extends AppError {
  constructor() {
    super("Gemini rate limit exceeded.", true);
  }
}

export class GeminiUnavailableError extends AppError {
  constructor() {
    super(
      "Gemini is temporarily unavailable.",
      true
    );
  }
}

export class GeminiAuthenticationError extends AppError {
  constructor() {
    super("Invalid Gemini API key.", false);
  }
}

export class InvalidGeminiResponseError extends AppError {
  constructor() {
    super("Gemini returned invalid JSON.", false);
  }
}