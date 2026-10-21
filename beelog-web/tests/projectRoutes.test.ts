import test from "node:test";
import assert from "node:assert/strict";
import { projectPath, projectSlugFromPath, slugifyProject } from "../src/domain/projectRoutes.ts";

test("project slugs and paths are URL safe and parse direct routes", () => {
  assert.equal(slugifyProject("Forest & Ruins: Lighting Test"), "forest-ruins-lighting-test");
  const path = projectPath({ name: "Forest Ruins", slug: "forest-ruins-2" });
  assert.equal(path, "/projects/forest-ruins-2");
  assert.equal(projectSlugFromPath(path), "forest-ruins-2");
  assert.equal(projectSlugFromPath("/timeline"), null);
});
