import fs from "node:fs/promises";

import {
  ConfigNotFoundError,
  InvalidConfigError,
} from "../errors/config-errors";

import { AuditConfig } from "../types/config";

export class ConfigLoader {
  async load(path = "config.json"): Promise<AuditConfig> {
    let file: string;

    try {
      file = await fs.readFile(path, "utf8");
    } catch {
      throw new ConfigNotFoundError(path);
    }

    try {
      return JSON.parse(file);
    } catch {
      throw new InvalidConfigError();
    }
  }
}