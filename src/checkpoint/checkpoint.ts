export interface Checkpoint {
  lastProcessedIndex: number;

  stats: {
    processed: number;
    flagged: number;
    failed: number;
  };

  updatedAt: string;
}