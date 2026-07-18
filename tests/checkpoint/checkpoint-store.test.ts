import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs/promises";

import { PATHS } from "../../src/config/paths";
import { CheckpointStore } from "../../src/checkpoint/checkpoint-store";

describe("CheckpointStore", () => {
  const store = new CheckpointStore();

  afterEach(async () => {
    try {
      await fs.unlink(PATHS.checkpoint);
    } catch {}
  });

  it("saves and loads a checkpoint", async () => {
    const checkpoint = {
      lastProcessedIndex: 5,
      stats: {
        processed: 5,
        flagged: 2,
        failed: 1,
      },
      updatedAt: "today",
    };

    await store.save(checkpoint);

    const loaded = await store.load();

    expect(loaded).toEqual(checkpoint);
  });

  it("returns null when checkpoint does not exist", async () => {
    const loaded = await store.load();

    expect(loaded).toBeNull();
  });

  it("clears checkpoint", async () => {
    await store.save({
      lastProcessedIndex: 1,
      stats: {
        processed: 1,
        flagged: 0,
        failed: 0,
      },
      updatedAt: "today",
    });

    await store.clear();

    expect(await store.load()).toBeNull();
  });
});