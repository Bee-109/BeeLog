import type { HomepageContent, PortfolioSnapshot, ProjectCategory, ProjectWorkCategory, ProjectWorkItem } from "../domain/models";

const categories: ProjectCategory[] = [
  { id: 1, name: "Blender", color: "#f5a34d", icon: "â—‰" },
  { id: 2, name: "Roblox Studio", color: "#4da9ff", icon: "â—†" },
  { id: 3, name: "Unreal Engine", color: "#dededb", icon: "U" },
  { id: 4, name: "Art & Design", color: "#e8b85a", icon: "âœŽ" },
  { id: 5, name: "Miscellaneous", color: "#e7b04c", icon: "â–°" },
];

const projects = [
  { id: 1, categoryId: 1, slug: "forest-tree-pack", name: "Forest Tree Pack", description: "Low poly tree variations and forest assets.", summary: "Low poly tree variations and forest assets.", coverImage: "/ex-image-1.jpg", createdAt: 1, status: "published" as const, tagIds: [1, 3] },
  { id: 2, categoryId: 3, slug: "forest-ruins", name: "Forest Ruins", description: "An atmospheric environment with volumetric lighting.", summary: "An atmospheric environment with volumetric lighting.", coverImage: "/ex-image-2.jpg", createdAt: 2, status: "published" as const, tagIds: [3] },
  { id: 3, categoryId: 2, slug: "drill-farm", name: "Drill Farm", description: "A simulator game with upgrade systems and custom UI.", summary: "A simulator game with upgrade systems and custom UI.", coverImage: "/ex-image-3.jpg", createdAt: 3, status: "published" as const, tagIds: [4] },
  { id: 4, categoryId: 4, slug: "bee-cat-companion", name: "Bee Cat Companion", description: "A character concept and 3D model exploration.", summary: "A character concept and 3D model exploration.", coverImage: "/ex-image-4.jpg", createdAt: 4, status: "published" as const, tagIds: [2] },
];

export const mockPortfolioSnapshot: PortfolioSnapshot = {
  categories,
  projects,
  devlogs: [
    { id: 1, title: "Low Poly Tree Variations", project: "Forest Tree Pack", projectId: 1, date: "Oct 19, 2026", createdAt: "2026-10-19T10:00:00.000Z", updatedAt: "2026-10-19T10:00:00.000Z", description: "Created multiple low poly tree variations for the forest environment. Tested different shapes and textures.", image: "/ex-image-1.jpg", images: 6, comments: 1, time: "2 hours ago", tagIds: [1, 3], status: "published" },
    { id: 2, title: "Forest Ruins – Lighting Test", project: "Forest Ruins", projectId: 2, date: "Oct 18, 2026", createdAt: "2026-10-18T10:00:00.000Z", updatedAt: "2026-10-18T10:00:00.000Z", description: "Experimented with volumetric fog and directional lighting. Adjusted exposure and added foliage.", image: "/ex-image-2.jpg", images: 8, comments: 2, time: "1 day ago", tagIds: [3], status: "published" },
    { id: 3, title: "Drill Farm – UI Progress", project: "Drill Farm", projectId: 3, date: "Oct 17, 2026", createdAt: "2026-10-17T10:00:00.000Z", updatedAt: "2026-10-17T10:00:00.000Z", description: "Working on upgrade UI and currency system. Tested different layouts.", image: "/ex-image-3.jpg", images: 4, comments: 0, videos: 1, time: "2 days ago", tagIds: [4], status: "published" },
    { id: 4, title: "Cat Companion Concept", project: "Bee Cat Companion", projectId: 4, date: "Oct 16, 2026", createdAt: "2026-10-16T10:00:00.000Z", updatedAt: "2026-10-16T10:00:00.000Z", description: "Concept sketches and colour palette for the bee-themed cat companion. Planning for 3D model next.", image: "/ex-image-4.jpg", images: 5, comments: 3, time: "3 days ago", tagIds: [2], status: "published" },
  ],
  tags: [
    { id: 1, name: "Low Poly", color: "#e8b85a" },
    { id: 2, name: "3D Modeling", color: "#f5a34d" },
    { id: 3, name: "Environment", color: "#72b7a1" },
    { id: 4, name: "UI", color: "#7db9f2" },
    { id: 5, name: "Bug Fix", color: "#e78378" },
    { id: 6, name: "Optimization", color: "#b49bea" },
  ],
  media: [
    "/ex-image-2.jpg", "/ex-image-5.jpg", "/ex-image-4.jpg", "/ex-image-1.jpg",
    "/ex-image-3.jpg", "/ex-image-2.jpg", "/ex-image-1.jpg",
  ].map((src, index) => ({
    id: index + 1,
    name: `Development Media ${String(index + 1).padStart(2, "0")}`,
    src,
    type: "image" as const,
    status: "published" as const,
    createdAt: new Date(Date.UTC(2026, 9, 19 - index)).toISOString(),
  })),
  activity: [],
  homepage: {
    id: "homepage",
    status: "published",
    hero: {
      image: "/ex-image-5.jpg",
      imagePosition: "center",
      headline: "A personal archive of my development journey.",
      subtitle: "Games, 3D art, environments, experiments, ideas and everything in between.",
      actionLabel: "Explore Devlogs",
      featuredProjectIds: [1, 2, 3],
    },
    quotes: [{ id: "quote-bee", text: "Ideas today, worlds tomorrow.", author: "Bee", active: true, order: 0, placement: "right-panel" }],
    sections: [
      { id: "recent-devlogs", title: "Recent Devlogs", description: "A little progress, captured.", visible: true, order: 0 },
      { id: "projects", title: "Projects", description: "The worlds you're building.", visible: true, order: 1 },
      { id: "latest-media", title: "Latest Media", description: "Snapshots from the process.", visible: true, order: 2 },
      { id: "heatmap", title: "Activity Calendar", description: "Your consistency over time.", visible: true, order: 3 },
    ],
    updatedAt: "2026-10-19T10:00:00.000Z",
  },
  workCategories: [
    { id: "gameplay", name: "Gameplay systems", order: 0 },
    { id: "ui", name: "UI and interface", order: 1 },
    { id: "assets", name: "Assets and environments", order: 2 },
  ],
  workItems: [],
  activityTypes: ["Asset creation", "New feature", "Bug fix", "Refactoring", "Optimization", "Experiment or research", "UI/UX implementation", "Gameplay", "Environment or level design", "Other"],
};

export interface PortfolioRepository {
  subscribe(listener: () => void, options?: { isAdmin?: boolean }): () => void;
  loadSnapshot(options?: { isAdmin?: boolean }): Promise<PortfolioSnapshot>;
  updateHomepage(content: HomepageContent): Promise<HomepageContent>;
  setActivityTypes(values: string[]): Promise<string[]>;
  createWorkCategory(input: Omit<ProjectWorkCategory, "id">): Promise<ProjectWorkCategory>;
  updateWorkCategory(id: string, changes: Partial<Omit<ProjectWorkCategory, "id">>): Promise<ProjectWorkCategory>;
  deleteWorkCategory(id: string): Promise<void>;
  createWorkItem(input: Omit<ProjectWorkItem, "id">): Promise<ProjectWorkItem>;
  updateWorkItem(id: string, changes: Partial<Omit<ProjectWorkItem, "id">>): Promise<ProjectWorkItem>;
  deleteWorkItem(id: string): Promise<void>;
  createCategory(input: Omit<ProjectCategory, "id">): Promise<ProjectCategory>;
  updateCategory(id: number, changes: Partial<Omit<ProjectCategory, "id">>): Promise<ProjectCategory>;
  deleteCategory(id: number): Promise<void>;
  createProject(input: Omit<PortfolioSnapshot["projects"][number], "id">): Promise<PortfolioSnapshot["projects"][number]>;
  updateProject(id: number, changes: Partial<Omit<PortfolioSnapshot["projects"][number], "id">>): Promise<PortfolioSnapshot["projects"][number]>;
  deleteProject(id: number): Promise<void>;
  createDevlog(input: Omit<PortfolioSnapshot["devlogs"][number], "id">): Promise<PortfolioSnapshot["devlogs"][number]>;
  updateDevlog(id: number, changes: Partial<Omit<PortfolioSnapshot["devlogs"][number], "id">>): Promise<PortfolioSnapshot["devlogs"][number]>;
  deleteDevlog(id: number): Promise<void>;
  createTag(input: Omit<PortfolioSnapshot["tags"][number], "id">): Promise<PortfolioSnapshot["tags"][number]>;
  updateTag(id: number, changes: Partial<Omit<PortfolioSnapshot["tags"][number], "id">>): Promise<PortfolioSnapshot["tags"][number]>;
  deleteTag(id: number): Promise<void>;
  createMedia(file: File, input: { name: string; projectId?: number; devlogId?: number; status: "draft" | "published" }): Promise<PortfolioSnapshot["media"][number]>;
  updateMedia(id: number, changes: Partial<Pick<PortfolioSnapshot["media"][number], "name" | "projectId" | "devlogId" | "status" | "altText" | "caption" | "order">>): Promise<PortfolioSnapshot["media"][number]>;
  deleteMedia(id: number): Promise<void>;
}

const mockState = structuredClone(mockPortfolioSnapshot);
const snapshotListeners = new Set<() => void>();
const notifySnapshot = () => snapshotListeners.forEach((listener) => listener());
const nextId = (items: Array<{ id: number }>) => Math.max(0, ...items.map((item) => item.id)) + 1;

export const mockPortfolioRepository: PortfolioRepository = {
  subscribe(listener) { snapshotListeners.add(listener); return () => { snapshotListeners.delete(listener); }; },
  async loadSnapshot() {
    return structuredClone(mockState);
  },
  async updateHomepage(content) { mockState.homepage = { ...structuredClone(content), updatedAt: new Date().toISOString() }; notifySnapshot(); return structuredClone(mockState.homepage); },
  async setActivityTypes(values) { mockState.activityTypes = [...new Set(values.map((value) => value.trim()).filter(Boolean))]; notifySnapshot(); return [...mockState.activityTypes]; },
  async createWorkCategory(input) { const item = { ...input, id: crypto.randomUUID() }; (mockState.workCategories ??= []).push(item); notifySnapshot(); return structuredClone(item); },
  async updateWorkCategory(id, changes) { const item = mockState.workCategories?.find((row) => row.id === id); if (!item) throw new Error("Work category not found"); Object.assign(item, changes); notifySnapshot(); return structuredClone(item); },
  async deleteWorkCategory(id) { mockState.workCategories = (mockState.workCategories ?? []).filter((row) => row.id !== id); notifySnapshot(); },
  async createWorkItem(input) { const item = { ...input, id: crypto.randomUUID() }; (mockState.workItems ??= []).push(item); notifySnapshot(); return structuredClone(item); },
  async updateWorkItem(id, changes) { const item = mockState.workItems?.find((row) => row.id === id); if (!item) throw new Error("Work item not found"); Object.assign(item, changes); notifySnapshot(); return structuredClone(item); },
  async deleteWorkItem(id) { mockState.workItems = (mockState.workItems ?? []).filter((row) => row.id !== id); notifySnapshot(); },
  async createCategory(input) { const item = { ...input, id: nextId(mockState.categories) }; mockState.categories.push(item); notifySnapshot(); return structuredClone(item); },
  async updateCategory(id, changes) { const item = mockState.categories.find((row) => row.id === id); if (!item) throw new Error("Category not found"); Object.assign(item, changes); notifySnapshot(); return structuredClone(item); },
  async deleteCategory(id) { if (mockState.projects.some((project) => project.categoryId === id)) throw new Error("Move or delete projects in this category first"); mockState.categories = mockState.categories.filter((item) => item.id !== id); notifySnapshot(); },
  async createProject(input) { const item = { ...input, createdAt: input.createdAt || Date.now(), id: nextId(mockState.projects) }; mockState.projects.push(item); notifySnapshot(); return structuredClone(item); },
  async updateProject(id, changes) { const item = mockState.projects.find((row) => row.id === id); if (!item) throw new Error("Project not found"); Object.assign(item, changes); notifySnapshot(); return structuredClone(item); },
  async deleteProject(id) { const project = mockState.projects.find((item) => item.id === id); mockState.projects = mockState.projects.filter((item) => item.id !== id); mockState.devlogs = mockState.devlogs.map((log) => log.projectId === id ? { ...log, projectId: undefined, project: "Unassigned" } : log); mockState.media = mockState.media.map((item) => item.projectId === id ? { ...item, projectId: undefined, ...(project?.status !== "published" && item.status === "published" ? { status: "draft" as const } : {}) } : item); mockState.workItems = (mockState.workItems ?? []).filter((item) => item.projectId !== id); notifySnapshot(); },
  async createDevlog(input) { const item = { ...input, id: nextId(mockState.devlogs), createdAt: input.createdAt ?? new Date().toISOString(), updatedAt: input.updatedAt ?? new Date().toISOString() }; mockState.devlogs.push(item); notifySnapshot(); return structuredClone(item); },
  async updateDevlog(id, changes) { const item = mockState.devlogs.find((row) => row.id === id); if (!item) throw new Error("Devlog not found"); Object.assign(item, changes, { updatedAt: new Date().toISOString() }); notifySnapshot(); return structuredClone(item); },
  async deleteDevlog(id) { mockState.devlogs = mockState.devlogs.filter((item) => item.id !== id); notifySnapshot(); },
  async createTag(input) { const item = { ...input, id: nextId(mockState.tags) }; mockState.tags.push(item); notifySnapshot(); return structuredClone(item); },
  async updateTag(id, changes) { const item = mockState.tags.find((row) => row.id === id); if (!item) throw new Error("Tag not found"); Object.assign(item, changes); notifySnapshot(); return structuredClone(item); },
  async deleteTag(id) { mockState.tags = mockState.tags.filter((item) => item.id !== id); mockState.projects.forEach((project) => { project.tagIds = project.tagIds.filter((tagId) => tagId !== id); }); mockState.devlogs.forEach((log) => { log.tagIds = log.tagIds.filter((tagId) => tagId !== id); }); notifySnapshot(); },
  async createMedia(file, input) { const item = { id: nextId(mockState.media), name: input.name, src: URL.createObjectURL(file), projectId: input.projectId, devlogId: input.devlogId, altText: input.name, type: file.type.startsWith("video/") ? "video" as const : "image" as const, status: input.status, createdAt: new Date().toISOString() }; mockState.media.push(item); notifySnapshot(); return structuredClone(item); },
  async updateMedia(id, changes) { const item = mockState.media.find((row) => row.id === id); if (!item) throw new Error("Media not found"); Object.assign(item, changes); notifySnapshot(); return structuredClone(item); },
  async deleteMedia(id) { const item = mockState.media.find((row) => row.id === id); if (item?.src.startsWith("blob:")) URL.revokeObjectURL(item.src); mockState.media = mockState.media.filter((row) => row.id !== id); notifySnapshot(); },
};
