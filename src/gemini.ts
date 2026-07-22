import { GoogleGenAI, Type } from "@google/genai";

import { AIClient, AnalysisResult } from "./ai";
import {
  GeminiAuthenticationError,
  GeminiRateLimitError,
  GeminiTimeoutError,
  GeminiUnavailableError,
  InvalidGeminiResponseError,
} from "./errors/gemini-errors";

export class GeminiClient implements AIClient {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  private extractJson(text: string): string {
    return text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  private mapError(error: unknown): never {
    const message = String(error);

    if (message.includes('"code":429')) {
      throw new GeminiRateLimitError();
    }

    if (message.includes('"code":503')) {
      throw new GeminiUnavailableError();
    }

    if (
      message.includes('"code":401') ||
      message.includes('"code":403')
    ) {
      throw new GeminiAuthenticationError();
    }

    if (
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("timed out")
    ) {
      throw new GeminiTimeoutError();
    }

    throw error;
  }

  async analyze(
    prompt: string
  ): Promise<AnalysisResult> {
    try {
      const response =
        await this.ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                flag: {
                  type: Type.BOOLEAN,
                },
                reason: {
                  type: Type.STRING,
                },
              },
              required: [
                "flag",
                "reason",
              ],
            },
          },
        });

      const text = this.extractJson(
        response.text ?? ""
      );

      if (!text) {
        throw new InvalidGeminiResponseError();
      }

      try {
        return JSON.parse(text);
      } catch {
        throw new InvalidGeminiResponseError();
      }
    } catch (error) {
      this.mapError(error);
    }
  }
}