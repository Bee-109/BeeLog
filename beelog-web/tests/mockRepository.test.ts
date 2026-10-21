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
