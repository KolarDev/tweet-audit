import { FlaggedTweet } from "../types/flagged-tweet";

export interface Writer {
  write(tweet: FlaggedTweet): Promise<void>;
}