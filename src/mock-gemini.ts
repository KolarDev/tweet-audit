import { AIClient, AnalysisResult } from "./ai";

export class MockGeminiClient implements AIClient {
  async analyzeTweet(tweet: string): Promise<AnalysisResult> {
    const lower = tweet.toLowerCase();

    return {
      flag: lower.includes("bitcoin") || lower.includes("crypto"),
      reason: "Mock analysis"
    };
  }
}