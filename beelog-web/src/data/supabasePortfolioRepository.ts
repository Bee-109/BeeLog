import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEntry, DevTag, Devlog, MediaRecord, PortfolioSnapshot, Project, ProjectCategory } from "../domain/models";
import type { PortfolioRepository } from "./mockPortfolioRepository";

type Row = Record<string, unknown>;
const number = (value: unknown) => Number(value);
const text = (value: unknown) => typeof value === "string" ? value : "";
const status = (value: unknown): "published" | "draft" => value === "draft" ? "draft" : "published";

/** Reads normalized portfolio records. RLS remains responsible for filtering drafts and activity. */
export class SupabasePortfolioRepository implements PortfolioRepository {
  private readonly client: SupabaseClient;
  constructor(client: SupabaseClient) { this.client = client; }

  async loadSnapshot({ isAdmin = false }: { isAdmin?: boolean } = {}): Promise<PortfolioSnapshot> {
    const [categoryResult, projectResult, devlogResult, tagResult, projectTagResult, devlogTagResult, mediaResult, activityResult] = await Promise.all([
      this.client.from("project_categories").select("*").order("name"),
      this.client.from("projects").select("*").order("created_at", { ascending: false }),
      this.client.from("devlogs").select("*").order("created_at", { ascending: false }),
      this.client.from("tags").select("*").order("name"),
      this.client.from("project_tags").select("project_id,tag_id"),
      this.client.from("devlog_tags").select("devlog_id,tag_id"),
      this.client.from("media").select("*").order("created_at", { ascending: false }),
      isAdmin ? this.client.from("admin_activity").select("*").order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null }),
    ]);

    const errors = [categoryResult, projectResult, devlogResult, tagResult, projectTagResult, devlogTagResult, mediaResult, activityResult].filter((result) => result.error);
    if (errors.length) throw new Error(`Could not load BeeLog content: ${errors.map((result) => result.error?.message).join("; ")}`);

    const projectTags = new Map<number, number[]>();
    for (const row of (projectTagResult.data ?? []) as Row[]) {
      const projectId = number(row.project_id);
      projectTags.set(projectId, [...(projectTags.get(projectId) ?? []), number(row.tag_id)]);
    }
    const devlogTags = new Map<number, number[]>();
    for (const row of (devlogTagResult.data ?? []) as Row[]) {
      const devlogId = number(row.devlog_id);
      devlogTags.set(devlogId, [...(devlogTags.get(devlogId) ?? []), number(row.tag_id)]);
    }

    const categories: ProjectCategory[] = ((categoryResult.data ?? []) as Row[]).map((row) => ({
      id: number(row.id), name: text(row.name), color: text(row.color), icon: text(row.icon),
    }));
    const projects: Project[] = ((projectResult.data ?? []) as Row[]).map((row) => ({
      id: number(row.id), categoryId: number(row.category_id), name: text(row.name), description: text(row.description),
      coverImage: text(row.cover_image) || undefined, createdAt: Date.parse(text(row.created_at)), status: status(row.status), tagIds: projectTags.get(number(row.id)) ?? [],
    }));
    const devlogs: Devlog[] = ((devlogResult.data ?? []) as Row[]).map((row) => ({
      id: number(row.id), title: text(row.title), projectId: row.project_id == null ? undefined : number(row.project_id),
      project: projects.find((project) => project.id === number(row.project_id))?.name ?? "Unassigned",
      date: new Date(text(row.published_at) || text(row.created_at)).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      description: text(row.description), image: text(row.cover_image), images: number(row.image_count ?? 0), comments: 0,
      videos: number(row.video_count ?? 0), time: new Date(text(row.created_at)).toLocaleDateString("en-US"),
      tagIds: devlogTags.get(number(row.id)) ?? [], status: status(row.status),
    }));
    const tags: DevTag[] = ((tagResult.data ?? []) as Row[]).map((row) => ({ id: number(row.id), name: text(row.name), color: text(row.color) }));
    const media: MediaRecord[] = await Promise.all(((mediaResult.data ?? []) as Row[]).map(async (row) => {
      const storagePath = text(row.storage_path);
      const { data: signed, error } = await this.client.storage.from("beelog-media").createSignedUrl(storagePath, 3600);
      if (error) throw error;
      return {
        id: number(row.id), name: text(row.name), src: signed.signedUrl, projectId: row.project_id == null ? undefined : number(row.project_id),
        devlogId: row.devlog_id == null ? undefined : number(row.devlog_id), type: row.media_type === "video" ? "video" : "image", status: status(row.status),
      };
    }));
    const activity: ActivityEntry[] = ((activityResult.data ?? []) as Row[]).map((row) => ({
      id: number(row.id), action: row.action as ActivityEntry["action"], entity: row.entity_type as ActivityEntry["entity"],
      title: text(row.title), project: text(row.context), details: text(row.details), timestamp: Date.parse(text(row.created_at)), actorId: text(row.actor_id),
    }));

    return { categories, projects, devlogs, tags, media, activity };
  }

  async createCategory(input: Omit<ProjectCategory, "id">) {
    const { data, error } = await this.client.from("project_categories").insert({ name: input.name, color: input.color, icon: input.icon }).select("*").single();
    if (error) throw error;
    return { id: number(data.id), name: text(data.name), color: text(data.color), icon: text(data.icon) };
  }

  async updateCategory(id: number, changes: Partial<Omit<ProjectCategory, "id">>) {
    const { data, error } = await this.client.from("project_categories").update({ name: changes.name, color: changes.color, icon: changes.icon }).eq("id", id).select("*").single();
    if (error) throw error;
    return { id: number(data.id), name: text(data.name), color: text(data.color), icon: text(data.icon) };
  }

  async deleteCategory(id: number) {
    const { error } = await this.client.from("project_categories").delete().eq("id", id);
    if (error) throw error;
  }

  async createProject(input: Omit<Project, "id">) {
    const { data, error } = await this.client.from("projects").insert({ category_id: input.categoryId, name: input.name, description: input.description, cover_image: input.coverImage, status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).select("*").single();
    if (error) throw error;
    const id = number(data.id);
    await this.replaceAssociations("project_tags", "project_id", id, input.tagIds);
    return { ...input, id, createdAt: Date.parse(text(data.created_at)) };
  }

  async updateProject(id: number, changes: Partial<Omit<Project, "id">>) {
    const update: Row = {};
    if (changes.categoryId !== undefined) update.category_id = changes.categoryId;
    if (changes.name !== undefined) update.name = changes.name;
    if (changes.description !== undefined) update.description = changes.description;
    if (changes.coverImage !== undefined) update.cover_image = changes.coverImage;
    if (changes.status !== undefined) { update.status = changes.status; update.published_at = changes.status === "published" ? new Date().toISOString() : null; }
    const { data, error } = await this.client.from("projects").update(update).eq("id", id).select("*").single();
    if (error) throw error;
    if (changes.tagIds) await this.replaceAssociations("project_tags", "project_id", id, changes.tagIds);
    return { id, categoryId: number(data.category_id), name: text(data.name), description: text(data.description), coverImage: text(data.cover_image) || undefined, createdAt: Date.parse(text(data.created_at)), status: status(data.status), tagIds: changes.tagIds ?? [] };
  }

  async deleteProject(id: number) {
    const { error } = await this.client.from("projects").delete().eq("id", id);
    if (error) throw error;
  }

  async createDevlog(input: Omit<Devlog, "id">) {
    const { data, error } = await this.client.from("devlogs").insert({ project_id: input.projectId ?? null, title: input.title, description: input.description, cover_image: input.image, image_count: input.images, video_count: input.videos ?? 0, status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).select("*").single();
    if (error) throw error;
    const id = number(data.id);
    await this.replaceAssociations("devlog_tags", "devlog_id", id, input.tagIds);
    return { ...input, id };
  }

  async updateDevlog(id: number, changes: Partial<Omit<Devlog, "id">>) {
    const update: Row = {};
    if (changes.projectId !== undefined) update.project_id = changes.projectId;
    if (changes.title !== undefined) update.title = changes.title;
    if (changes.description !== undefined) update.description = changes.description;
    if (changes.image !== undefined) update.cover_image = changes.image;
    if (changes.images !== undefined) update.image_count = changes.images;
    if (changes.videos !== undefined) update.video_count = changes.videos;
    if (changes.status !== undefined) { update.status = changes.status; update.published_at = changes.status === "published" ? new Date().toISOString() : null; }
    const { data, error } = await this.client.from("devlogs").update(update).eq("id", id).select("*").single();
    if (error) throw error;
    if (changes.tagIds) await this.replaceAssociations("devlog_tags", "devlog_id", id, changes.tagIds);
    const linkedProject = data.project_id == null ? null : await this.client.from("projects").select("name").eq("id", data.project_id).maybeSingle();
    if (linkedProject?.error) throw linkedProject.error;
    return {
      id, title: text(data.title), projectId: data.project_id == null ? undefined : number(data.project_id),
      project: changes.project ?? (text(linkedProject?.data?.name) || "Unassigned"), date: new Date(text(data.published_at) || text(data.created_at)).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      description: text(data.description), image: text(data.cover_image), images: number(data.image_count), comments: changes.comments ?? 0,
      videos: number(data.video_count), time: changes.time ?? "Updated", tagIds: changes.tagIds ?? [], status: status(data.status),
    };
  }

  async deleteDevlog(id: number) {
    const { error } = await this.client.from("devlogs").delete().eq("id", id);
    if (error) throw error;
  }

  async createTag(input: Omit<DevTag, "id">) {
    const { data, error } = await this.client.from("tags").insert({ name: input.name, color: input.color }).select("*").single();
    if (error) throw error;
    return { id: number(data.id), name: text(data.name), color: text(data.color) };
  }

  async updateTag(id: number, changes: Partial<Omit<DevTag, "id">>) {
    const { data, error } = await this.client.from("tags").update({ name: changes.name, color: changes.color }).eq("id", id).select("*").single();
    if (error) throw error;
    return { id: number(data.id), name: text(data.name), color: text(data.color) };
  }

  async deleteTag(id: number) {
    const { error } = await this.client.from("tags").delete().eq("id", id);
    if (error) throw error;
  }

  async createMedia(file: File, input: { name: string; projectId?: number; status: "draft" | "published" }) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await this.client.storage.from("beelog-media").upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) throw uploadError;
    const { data, error } = await this.client.from("media").insert({ name: input.name, project_id: input.projectId ?? null, storage_path: storagePath, media_type: file.type.startsWith("video/") ? "video" : "image", status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).select("*").single();
    if (error) { await this.client.storage.from("beelog-media").remove([storagePath]); throw error; }
    const { data: signed, error: signedError } = await this.client.storage.from("beelog-media").createSignedUrl(storagePath, 3600);
    if (signedError) throw signedError;
    return { id: number(data.id), name: text(data.name), src: signed.signedUrl, projectId: data.project_id == null ? undefined : number(data.project_id), type: data.media_type === "video" ? "video" as const : "image" as const, status: status(data.status) };
  }

  async updateMedia(id: number, changes: Partial<Pick<MediaRecord, "name" | "projectId" | "status">>) {
    const update: Row = {};
    if (changes.name !== undefined) update.name = changes.name;
    if (changes.projectId !== undefined) update.project_id = changes.projectId;
    if (changes.status !== undefined) { update.status = changes.status; update.published_at = changes.status === "published" ? new Date().toISOString() : null; }
    const { data, error } = await this.client.from("media").update(update).eq("id", id).select("*").single();
    if (error) throw error;
    const { data: signed, error: signedError } = await this.client.storage.from("beelog-media").createSignedUrl(text(data.storage_path), 3600);
    if (signedError) throw signedError;
    return { id: number(data.id), name: text(data.name), src: signed.signedUrl, projectId: data.project_id == null ? undefined : number(data.project_id), type: data.media_type === "video" ? "video" as const : "image" as const, status: status(data.status) };
  }

  async deleteMedia(id: number) {
    const { data, error: selectError } = await this.client.from("media").select("storage_path").eq("id", id).single();
    if (selectError) throw selectError;
    const { error } = await this.client.from("media").delete().eq("id", id);
    if (error) throw error;
    const { error: storageError } = await this.client.storage.from("beelog-media").remove([text(data.storage_path)]);
    if (storageError) throw storageError;
  }

  private async replaceAssociations(table: "project_tags" | "devlog_tags", ownerColumn: "project_id" | "devlog_id", ownerId: number, tagIds: number[]) {
    const { error: deleteError } = await this.client.from(table).delete().eq(ownerColumn, ownerId);
    if (deleteError) throw deleteError;
    if (!tagIds.length) return;
    const rows = tagIds.map((tagId) => ({ [ownerColumn]: ownerId, tag_id: tagId }));
    const { error } = await this.client.from(table).insert(rows);
    if (error) throw error;
  }
}
