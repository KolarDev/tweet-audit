export interface AnalysisResult {
  flag: boolean;
  reason: string;
}

export interface AIClient {
  analyze(prompt: string): Promise<AnalysisResult>;
}