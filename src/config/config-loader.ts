import fs from "node:fs/promises";

import { AuditConfig } from "../types/config";

export class ConfigLoader {
  async load(path = "config.json"): Promise<AuditConfig> {
    const file = await fs.readFile(path, "utf8");

    return JSON.parse(file);
  }
}