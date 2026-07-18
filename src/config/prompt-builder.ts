import { AuditConfig } from "../types/config";

export class PromptBuilder {
  build(tweet: string, config: AuditConfig): string {
    return `
You are evaluating tweets.

Criteria:

Forbidden words:
${config.criteria.forbiddenWords.join(", ")}

Professional language required:
${config.criteria.professionalCheck}

Exclude political content:
${config.criteria.excludePolitics}

Desired tone:
${config.criteria.tone}

Return ONLY JSON.

{
  "flag": true,
  "reason": "..."
}

Tweet:

"${tweet}"
`;
  }
}