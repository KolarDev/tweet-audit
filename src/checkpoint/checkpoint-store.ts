import fs from "node:fs/promises";

import { PATHS } from "../config/paths";
import { Checkpoint } from "./checkpoint";

export class CheckpointStore {
  async load(): Promise<Checkpoint | null> {
    try {
      const file = await fs.readFile(
        PATHS.checkpoint,
        "utf8"
      );

      return JSON.parse(file);
    } catch {
      return null;
    }
  }

  async save(
    checkpoint: Checkpoint
  ): Promise<void> {
    await fs.writeFile(
      PATHS.checkpoint,
      JSON.stringify(checkpoint, null, 2)
    );
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(PATHS.checkpoint);
    } catch {
      // No checkpoint exists.
    }
  }
}