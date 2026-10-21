import type { Project } from "./models";

export function slugifyProject(name: string) {
  return name.trim().toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

export function projectPath(project: Pick<Project, "name" | "slug">) {
  return `/projects/${encodeURIComponent(project.slug || slugifyProject(project.name))}`;
}

export function projectSlugFromPath(pathname: string) {
  const match = /^\/projects\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}
