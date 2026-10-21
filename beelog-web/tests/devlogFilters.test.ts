import test from "node:test";
import assert from "node:assert/strict";
import type { Devlog } from "../src/domain/models.ts";
import { defaultDevlogFilters, filterAndSortDevlogs } from "../src/domain/devlogFilters.ts";

const fixture = (overrides: Partial<Devlog> = {}): Devlog => ({
  id: 1, title: "Tree tools", project: "Forest Pack", projectId: 10, categoryId: 2, date: "Oct 20, 2026", createdAt: "2026-10-20T10:00:00.000Z", updatedAt: "2026-10-21T10:00:00.000Z",
  description: "Added a procedural workflow", image: "/tree.jpg", images: 2, comments: 0, time: "today", tagIds: [1, 3], status: "published", activityType: "New feature", ...overrides,
});

test("filters use the original creation time and support intersecting tag selections", () => {
  const logs = [fixture(), fixture({ id: 2, title: "Older", createdAt: "2026-09-01T10:00:00.000Z", tagIds: [1] })];
  const result = filterAndSortDevlogs(logs, { ...defaultDevlogFilters, dateRange: "7d", tagIds: [1, 3] }, new Date("2026-10-22T10:00:00.000Z"));
  assert.deepEqual(result.map((log) => log.id), [1]);
});

test("supports content and metadata filters with stable sorting", () => {
  const logs = [fixture({ id: 1, title: "zeta", externalLinks: [{ id: "a", label: "Demo", url: "https://example.com" }] }), fixture({ id: 2, title: "Alpha", images: 0, image: "", videos: 1, codeSnippets: [{ id: "c", code: "print(1)" }] })];
  assert.deepEqual(filterAndSortDevlogs(logs, { ...defaultDevlogFilters, contentType: "videos", hasCode: true, sort: "title" }).map((log) => log.id), [2]);
  assert.deepEqual(filterAndSortDevlogs(logs, { ...defaultDevlogFilters, contentType: "links" }).map((log) => log.id), [1]);
});

test("image filtering uses actual attachment counts when media ids are absent", () => {
  const log = fixture({ images: 3, mediaIds: [] });
  assert.equal(filterAndSortDevlogs([log], { ...defaultDevlogFilters, contentType: "images" }).length, 1);
});
