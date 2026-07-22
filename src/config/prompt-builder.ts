import { AuditConfig } from "../types/config";

export class PromptBuilder {
  build(
    tweet: string,
    config: AuditConfig
  ): string {
    return `
You are reviewing tweets for a professional public profile.

Evaluate the tweet using the following criteria.

Forbidden words:
${config.criteria.forbiddenWords.join(", ")}

Professional language required:
${config.criteria.professionalCheck}

Exclude political content:
${config.criteria.excludePolitics}

Desired tone:
${config.criteria.tone}

Flag the tweet only if it violates one or more of the criteria above.

If the tweet should be flagged, provide a concise reason explaining why.

Tweet:

"${tweet}"
`;
  }
}