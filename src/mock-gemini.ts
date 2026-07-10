import { AIClient, AnalysisResult } from "./ai";

export class MockGeminiClient implements AIClient {
  async analyze(_: string): Promise<AnalysisResult> {
    return {
      flag: Math.random() > 0.5,
      reason: "Mock response",
    };
  }
}