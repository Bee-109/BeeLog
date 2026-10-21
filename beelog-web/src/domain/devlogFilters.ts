import type { Devlog } from "./models";

export type DateRange = "any" | "today" | "7d" | "30d" | "month" | "year" | "custom";
export type DevlogSort = "newest" | "oldest" | "updated" | "title";
export type DevlogFilters = {
  categoryId: number | null;
  projectId: number | null;
  tagIds: number[];
  dateRange: DateRange;
  startDate: string;
  endDate: string;
  activityType: string;
  contentType: "all" | "images" | "videos" | "links" | "multiple-media" | "text-only";
  hasProblems: boolean;
  hasBugsFixed: boolean;
  hasNextPlans: boolean;
  hasCode: boolean;
  recentlyUpdated: boolean;
  status: "all" | "published" | "draft" | "unpublished";
  sort: DevlogSort;
  query: string;
};

export const defaultDevlogFilters: DevlogFilters = {
  categoryId: null, projectId: null, tagIds: [], dateRange: "any", startDate: "", endDate: "", activityType: "all",
  contentType: "all", hasProblems: false, hasBugsFixed: false, hasNextPlans: false, hasCode: false, recentlyUpdated: false, status: "all", sort: "newest", query: "",
};

function validDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function devlogMatchesFilters(log: Devlog, filters: DevlogFilters, now = new Date()): boolean {
  if (filters.query.trim() && !`${log.title} ${log.description} ${log.project}`.toLocaleLowerCase().includes(filters.query.trim().toLocaleLowerCase())) return false;
  if (filters.projectId !== null && log.projectId !== filters.projectId) return false;
  if (filters.categoryId !== null && log.categoryId !== filters.categoryId) return false;
  // Multiple selected tags use AND semantics: every selected tag must be present.
  if (filters.tagIds.some((id) => !(log.tagIds ?? []).includes(id))) return false;
  if (filters.activityType !== "all" && log.activityType !== filters.activityType) return false;
  if (filters.status !== "all" && log.status !== filters.status) return false;
  if (filters.hasProblems && !(log.problemsFaced?.length)) return false;
  if (filters.hasBugsFixed && !(log.bugsFixed?.length)) return false;
  if (filters.hasNextPlans && !(log.nextPlans?.length)) return false;
  if (filters.hasCode && !(log.codeSnippets?.length)) return false;
  if (filters.recentlyUpdated) {
    const updated = validDate(log.updatedAt);
    if (!updated || now.getTime() - updated.getTime() > 7 * 86_400_000 || updated > now) return false;
  }

  const imageCount = Math.max(log.mediaIds?.length ?? 0, log.images ?? 0);
  const videoCount = log.videos ?? 0;
  const linkCount = log.externalLinks?.length ?? 0;
  if (filters.contentType === "images" && imageCount < 1) return false;
  if (filters.contentType === "videos" && videoCount < 1) return false;
  if (filters.contentType === "links" && linkCount < 1) return false;
  if (filters.contentType === "multiple-media" && imageCount + videoCount < 2) return false;
  if (filters.contentType === "text-only" && (imageCount + videoCount + linkCount > 0)) return false;

  const createdAt = validDate(log.createdAt) ?? validDate(log.date);
  if (filters.dateRange !== "any") {
    if (!createdAt || createdAt > now) return false;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (filters.dateRange === "today" && createdAt < start) return false;
    if (filters.dateRange === "7d" && now.getTime() - createdAt.getTime() > 7 * 86_400_000) return false;
    if (filters.dateRange === "30d" && now.getTime() - createdAt.getTime() > 30 * 86_400_000) return false;
    if (filters.dateRange === "month" && (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear())) return false;
    if (filters.dateRange === "year" && createdAt.getFullYear() !== now.getFullYear()) return false;
    if (filters.dateRange === "custom") {
      if (filters.startDate && createdAt < new Date(`${filters.startDate}T00:00:00`)) return false;
      if (filters.endDate && createdAt >= new Date(`${filters.endDate}T23:59:59.999`)) return false;
    }
  }
  return true;
}

export function filterAndSortDevlogs(logs: Devlog[], filters: DevlogFilters, now = new Date()): Devlog[] {
  return logs.filter((log) => devlogMatchesFilters(log, filters, now)).sort((a, b) => {
    if (filters.sort === "title") return a.title.localeCompare(b.title);
    if (filters.sort === "updated") return (validDate(b.updatedAt)?.getTime() ?? 0) - (validDate(a.updatedAt)?.getTime() ?? 0);
    const aCreated = validDate(a.createdAt) ?? validDate(a.date)?.getTime();
    const bCreated = validDate(b.createdAt) ?? validDate(b.date)?.getTime();
    return filters.sort === "oldest" ? Number(aCreated ?? 0) - Number(bCreated ?? 0) : Number(bCreated ?? 0) - Number(aCreated ?? 0);
  });
}
