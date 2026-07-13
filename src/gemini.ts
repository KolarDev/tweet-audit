import { GoogleGenAI } from "@google/genai";
import { AIClient, AnalysisResult } from "./ai";
import { InvalidGeminiResponseError } from "./errors/gemini-errors";

export class GeminiClient implements AIClient {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async analyze(prompt: string): Promise<AnalysisResult> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    try {
      return JSON.parse(response.text!);
    } catch {
      throw new InvalidGeminiResponseError();
    }
  }
}