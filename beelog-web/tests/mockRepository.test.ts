import test from "node:test";
import assert from "node:assert/strict";
import { mockPortfolioRepository } from "../src/data/mockPortfolioRepository.ts";

test("mock repository persists homepage edits for its session and publishes change notifications", async () => {
  const before = await mockPortfolioRepository.loadSnapshot();
  assert.ok(before.homepage);
  let notifications = 0;
  const unsubscribe = mockPortfolioRepository.subscribe(() => { notifications += 1; });
  const changed = { ...before.homepage!, hero: { ...before.homepage!.hero, headline: "Repository-backed homepage test" } };
  await mockPortfolioRepository.updateHomepage(changed);
  unsubscribe();
  const after = await mockPortfolioRepository.loadSnapshot();
  assert.equal(after.homepage?.hero.headline, "Repository-backed homepage test");
  assert.equal(notifications, 1);
  const workCategory = await mockPortfolioRepository.createWorkCategory({ name: "Test contribution", order: 4 });
  const workItem = await mockPortfolioRepository.createWorkItem({ projectId: 1, categoryId: workCategory.id, title: "Test item", description: "Stored through repository", status: "complete", publicationStatus: "published", mediaIds: [], links: [], technologyIds: [], order: 0 });
  const withWork = await mockPortfolioRepository.loadSnapshot();
  assert.equal(withWork.workCategories?.some((item) => item.id === workCategory.id), true);
  assert.equal(withWork.workItems?.find((item) => item.id === workItem.id)?.projectId, 1);
  assert.deepEqual(await mockPortfolioRepository.setActivityTypes(["New feature", "QA"]), ["New feature", "QA"]);
});

test("mock projects persist pin state and delete safely without deleting linked devlogs", async () => {
  const project = await mockPortfolioRepository.createProject({ categoryId: 1, name: "Temporary test project", slug: "temporary-test-project", description: "For repository test", createdAt: Date.now(), status: "draft", tagIds: [] });
  const pinned = await mockPortfolioRepository.updateProject(project.id, { pinned: true });
  assert.equal(pinned.pinned, true);
  assert.equal((await mockPortfolioRepository.loadSnapshot()).projects.find((item) => item.id === project.id)?.pinned, true);
  const log = await mockPortfolioRepository.createDevlog({ title: "Linked log", project: project.name, projectId: project.id, date: "Oct 22, 2026", description: "Retained after project deletion", image: "", images: 0, comments: 0, time: "Now", tagIds: [], status: "draft" });
  const contribution = await mockPortfolioRepository.createWorkItem({ projectId: project.id, title: "Linked contribution", description: "Removed with project", status: "complete", publicationStatus: "draft", mediaIds: [], links: [], technologyIds: [], order: 0 });
  await mockPortfolioRepository.deleteProject(project.id);
  const after = await mockPortfolioRepository.loadSnapshot();
  assert.equal(after.projects.some((item) => item.id === project.id), false);
  assert.equal(after.devlogs.find((item) => item.id === log.id)?.projectId, undefined);
  assert.equal(after.workItems?.some((item) => item.id === contribution.id), false);
});
