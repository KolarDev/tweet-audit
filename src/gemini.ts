import { GoogleGenAI } from "@google/genai";
import { AIClient, AnalysisResult } from "./ai";

export class GeminiClient implements AIClient {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async analyzeTweet(tweet: string): Promise<AnalysisResult> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are evaluating tweets.

Flag tweets that:
- contain crypto promotion
- contain unprofessional language
- contain political arguments

Return ONLY JSON.

{
  "flag": true,
  "reason": "..."
}

Tweet:
"${tweet}"
`,
    });

    return JSON.parse(response.text!);
  }
}