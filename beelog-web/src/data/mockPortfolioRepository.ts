import type { PortfolioSnapshot, ProjectCategory } from "../domain/models";

const categories: ProjectCategory[] = [
  { id: 1, name: "Blender", color: "#f5a34d", icon: "â—‰" },
  { id: 2, name: "Roblox Studio", color: "#4da9ff", icon: "â—†" },
  { id: 3, name: "Unreal Engine", color: "#dededb", icon: "U" },
  { id: 4, name: "Art & Design", color: "#e8b85a", icon: "âœŽ" },
  { id: 5, name: "Miscellaneous", color: "#e7b04c", icon: "â–°" },
];

const projects = [
  { id: 1, categoryId: 1, name: "Forest Tree Pack", description: "Low poly tree variations and forest assets.", coverImage: "/ex-image-1.jpg", createdAt: 1, status: "published" as const, tagIds: [1, 3] },
  { id: 2, categoryId: 3, name: "Forest Ruins", description: "An atmospheric environment with volumetric lighting.", coverImage: "/ex-image-2.jpg", createdAt: 2, status: "published" as const, tagIds: [3] },
  { id: 3, categoryId: 2, name: "Drill Farm", description: "A simulator game with upgrade systems and custom UI.", coverImage: "/ex-image-3.jpg", createdAt: 3, status: "published" as const, tagIds: [4] },
  { id: 4, categoryId: 4, name: "Bee Cat Companion", description: "A character concept and 3D model exploration.", coverImage: "/ex-image-4.jpg", createdAt: 4, status: "published" as const, tagIds: [2] },
];

export const mockPortfolioSnapshot: PortfolioSnapshot = {
  categories,
  projects,
  devlogs: [
    { id: 1, title: "Low Poly Tree Variations", project: "Forest Tree Pack", projectId: 1, date: "Oct 19, 2026", description: "Created multiple low poly tree variations for the forest environment. Tested different shapes and textures.", image: "/ex-image-1.jpg", images: 6, comments: 1, time: "2 hours ago", tagIds: [1, 3], status: "published" },
    { id: 2, title: "Forest Ruins – Lighting Test", project: "Forest Ruins", projectId: 2, date: "Oct 18, 2026", description: "Experimented with volumetric fog and directional lighting. Adjusted exposure and added foliage.", image: "/ex-image-2.jpg", images: 8, comments: 2, time: "1 day ago", tagIds: [3], status: "published" },
    { id: 3, title: "Drill Farm – UI Progress", project: "Drill Farm", projectId: 3, date: "Oct 17, 2026", description: "Working on upgrade UI and currency system. Tested different layouts.", image: "/ex-image-3.jpg", images: 4, comments: 0, videos: 1, time: "2 days ago", tagIds: [4], status: "published" },
    { id: 4, title: "Cat Companion Concept", project: "Bee Cat Companion", projectId: 4, date: "Oct 16, 2026", description: "Concept sketches and colour palette for the bee-themed cat companion. Planning for 3D model next.", image: "/ex-image-4.jpg", images: 5, comments: 3, time: "3 days ago", tagIds: [2], status: "published" },
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
  })),
  activity: [],
};

export interface PortfolioRepository {
  loadSnapshot(options?: { isAdmin?: boolean }): Promise<PortfolioSnapshot>;
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
  createMedia(file: File, input: { name: string; projectId?: number; status: "draft" | "published" }): Promise<PortfolioSnapshot["media"][number]>;
  updateMedia(id: number, changes: Partial<Pick<PortfolioSnapshot["media"][number], "name" | "projectId" | "status">>): Promise<PortfolioSnapshot["media"][number]>;
  deleteMedia(id: number): Promise<void>;
}

let mockState = structuredClone(mockPortfolioSnapshot);
const nextId = (items: Array<{ id: number }>) => Math.max(0, ...items.map((item) => item.id)) + 1;

export const mockPortfolioRepository: PortfolioRepository = {
  async loadSnapshot() {
    return structuredClone(mockState);
  },
  async createCategory(input) { const item = { ...input, id: nextId(mockState.categories) }; mockState.categories.push(item); return structuredClone(item); },
  async updateCategory(id, changes) { const item = mockState.categories.find((row) => row.id === id); if (!item) throw new Error("Category not found"); Object.assign(item, changes); return structuredClone(item); },
  async deleteCategory(id) { if (mockState.projects.some((project) => project.categoryId === id)) throw new Error("Move or delete projects in this category first"); mockState.categories = mockState.categories.filter((item) => item.id !== id); },
  async createProject(input) { const item = { ...input, id: nextId(mockState.projects) }; mockState.projects.push(item); return structuredClone(item); },
  async updateProject(id, changes) { const item = mockState.projects.find((row) => row.id === id); if (!item) throw new Error("Project not found"); Object.assign(item, changes); return structuredClone(item); },
  async deleteProject(id) { mockState.projects = mockState.projects.filter((item) => item.id !== id); mockState.devlogs = mockState.devlogs.map((log) => log.projectId === id ? { ...log, projectId: undefined, project: "Unassigned" } : log); },
  async createDevlog(input) { const item = { ...input, id: nextId(mockState.devlogs) }; mockState.devlogs.push(item); return structuredClone(item); },
  async updateDevlog(id, changes) { const item = mockState.devlogs.find((row) => row.id === id); if (!item) throw new Error("Devlog not found"); Object.assign(item, changes); return structuredClone(item); },
  async deleteDevlog(id) { mockState.devlogs = mockState.devlogs.filter((item) => item.id !== id); },
  async createTag(input) { const item = { ...input, id: nextId(mockState.tags) }; mockState.tags.push(item); return structuredClone(item); },
  async updateTag(id, changes) { const item = mockState.tags.find((row) => row.id === id); if (!item) throw new Error("Tag not found"); Object.assign(item, changes); return structuredClone(item); },
  async deleteTag(id) { mockState.tags = mockState.tags.filter((item) => item.id !== id); mockState.projects.forEach((project) => { project.tagIds = project.tagIds.filter((tagId) => tagId !== id); }); mockState.devlogs.forEach((log) => { log.tagIds = log.tagIds.filter((tagId) => tagId !== id); }); },
  async createMedia(file, input) { const item = { id: nextId(mockState.media), name: input.name, src: URL.createObjectURL(file), projectId: input.projectId, type: file.type.startsWith("video/") ? "video" as const : "image" as const, status: input.status }; mockState.media.push(item); return structuredClone(item); },
  async updateMedia(id, changes) { const item = mockState.media.find((row) => row.id === id); if (!item) throw new Error("Media not found"); Object.assign(item, changes); return structuredClone(item); },
  async deleteMedia(id) { const item = mockState.media.find((row) => row.id === id); if (item?.src.startsWith("blob:")) URL.revokeObjectURL(item.src); mockState.media = mockState.media.filter((row) => row.id !== id); },
};
