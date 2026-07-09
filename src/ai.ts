export interface AnalysisResult {
  flag: boolean;
  reason: string;
}

export interface AIClient {
  analyzeTweet(tweet: string): Promise<AnalysisResult>;
}