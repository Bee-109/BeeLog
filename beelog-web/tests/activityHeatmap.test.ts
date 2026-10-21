import test from "node:test";
import assert from "node:assert/strict";
import type { Devlog } from "../src/domain/models.ts";
import { activityLevel, countDevlogsByCreationDate } from "../src/domain/activityHeatmap.ts";

const entry = (id: number, createdAt: string, updatedAt = createdAt): Devlog => ({ id, title: `Entry ${id}`, project: "Workspace", date: "Oct 1, 2026", createdAt, updatedAt, description: "", image: "", images: 0, comments: 0, time: "", tagIds: [], status: "published" });

test("heatmap counts original creation dates, not edit dates", () => {
  const counts = countDevlogsByCreationDate([entry(1, "2026-10-01T08:00:00.000Z", "2026-10-03T08:00:00.000Z"), entry(2, "2026-10-01T09:00:00.000Z")]);
  assert.equal(counts.get("2026-10-01"), 2);
  assert.equal(counts.get("2026-10-03"), undefined);
});

test("maps actual daily counts to heatmap levels", () => {
  assert.deepEqual([0, 1, 2, 4, 6].map(activityLevel), [0, 1, 2, 3, 4]);
});
