export interface AuditConfig {
  criteria: {
    forbiddenWords: string[];
    professionalCheck: boolean;
    excludePolitics: boolean;
    tone: string;
  };

  processing: {
    requestsPerSecond: number;
    checkpointInterval: number;
  };
}