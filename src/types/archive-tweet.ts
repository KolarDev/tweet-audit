export interface ArchiveTweet {
  tweet: {
    id: string;
    id_str: string;
    full_text: string;
    created_at: string;
    lang: string;
    retweeted: boolean;
    favorited: boolean;
  };
}