import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEntry, DevTag, Devlog, HomepageContent, MediaRecord, PortfolioSnapshot, Project, ProjectCategory, ProjectWorkCategory, ProjectWorkItem } from "../domain/models";
import type { PortfolioRepository } from "./mockPortfolioRepository";

type Row = Record<string, unknown>;
const number = (value: unknown) => Number(value);
const text = (value: unknown) => typeof value === "string" ? value : "";
const status = (value: unknown): "published" | "draft" | "unpublished" => value === "draft" || value === "unpublished" ? value : "published";
const projectDetails = (value: unknown): Partial<Project> => {
  const row = value && typeof value === "object" ? value as Row : {};
  return {
    genres: Array.isArray(row.genres) ? row.genres.map(text) : [],
    platforms: Array.isArray(row.platforms) ? row.platforms.map(text) : [],
    technologies: Array.isArray(row.technologies) ? row.technologies as Project["technologies"] : [],
    goals: Array.isArray(row.goals) ? row.goals.map(text) : [],
    keyFeatures: Array.isArray(row.key_features) ? row.key_features.map(text) : [],
    workItemIds: Array.isArray(row.work_item_ids) ? row.work_item_ids.map(text) : [],
    problems: Array.isArray(row.problems) ? row.problems as Project["problems"] : [],
    lessonsLearned: Array.isArray(row.lessons_learned) ? row.lessons_learned as Project["lessonsLearned"] : [],
    futurePlans: Array.isArray(row.future_plans) ? row.future_plans as Project["futurePlans"] : [],
    externalLinks: Array.isArray(row.external_links) ? row.external_links as Project["externalLinks"] : [],
    primaryAction: row.primary_action as Project["primaryAction"],
    statistics: Array.isArray(row.statistics) ? row.statistics as Project["statistics"] : [],
    startDate: text(row.start_date) || undefined,
    completedDate: text(row.completed_date) || undefined,
    coverMediaId: row.cover_media_id == null ? undefined : number(row.cover_media_id),
    pinned: row.pinned === true,
  };
};
const projectDetailPayload = (project: Partial<Project>): Row => {
  const details: Row = {};
  if (project.genres !== undefined) details.genres = project.genres;
  if (project.platforms !== undefined) details.platforms = project.platforms;
  if (project.technologies !== undefined) details.technologies = project.technologies;
  if (project.goals !== undefined) details.goals = project.goals;
  if (project.keyFeatures !== undefined) details.key_features = project.keyFeatures;
  if (project.workItemIds !== undefined) details.work_item_ids = project.workItemIds;
  if (project.problems !== undefined) details.problems = project.problems;
  if (project.lessonsLearned !== undefined) details.lessons_learned = project.lessonsLearned;
  if (project.futurePlans !== undefined) details.future_plans = project.futurePlans;
  if (project.externalLinks !== undefined) details.external_links = project.externalLinks;
  if (project.primaryAction !== undefined) details.primary_action = project.primaryAction;
  if (project.statistics !== undefined) details.statistics = project.statistics;
  if (project.startDate !== undefined) details.start_date = project.startDate;
  if (project.completedDate !== undefined) details.completed_date = project.completedDate;
  if (project.coverMediaId !== undefined) details.cover_media_id = project.coverMediaId;
  if (project.pinned !== undefined) details.pinned = project.pinned;
  return details;
};

/** Reads normalized portfolio records. RLS remains responsible for filtering drafts and activity. */
export class SupabasePortfolioRepository implements PortfolioRepository {
  private readonly client: SupabaseClient;
  constructor(client: SupabaseClient) { this.client = client; }

  subscribe(listener: () => void, options: { isAdmin?: boolean } = {}) {
    const tables = ["project_categories", "projects", "devlogs", "tags", "project_tags", "devlog_tags", "media", "homepage_content", "project_work_categories", "project_work_items", "activity_types", ...(options.isAdmin ? ["admin_activity"] : [])];
    let channel = this.client.channel(`beelog-content-${options.isAdmin ? "admin" : "public"}`);
    for (const table of tables) channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, listener);
    channel.subscribe();
    return () => { void this.client.removeChannel(channel); };
  }

  async loadSnapshot({ isAdmin = false }: { isAdmin?: boolean } = {}): Promise<PortfolioSnapshot> {
    const [categoryResult, projectResult, devlogResult, tagResult, projectTagResult, devlogTagResult, mediaResult, activityResult, homepageResult, workCategoryResult, workItemResult, activityTypeResult] = await Promise.all([
      this.client.from("project_categories").select("*").order("name"),
      this.client.from("projects").select("*").order("created_at", { ascending: false }),
      this.client.from("devlogs").select("*").order("created_at", { ascending: false }),
      this.client.from("tags").select("*").order("name"),
      this.client.from("project_tags").select("project_id,tag_id"),
      this.client.from("devlog_tags").select("devlog_id,tag_id"),
      this.client.from("media").select("*").order("created_at", { ascending: false }),
      isAdmin ? this.client.from("admin_activity").select("*").order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null }),
      this.client.from("homepage_content").select("content, updated_at").eq("id", "homepage").maybeSingle(),
      this.client.from("project_work_categories").select("*").order("sort_order"),
      this.client.from("project_work_items").select("*").order("sort_order"),
      this.client.from("activity_types").select("name").eq("enabled", true).order("sort_order"),
    ]);

    const errors = [categoryResult, projectResult, devlogResult, tagResult, projectTagResult, devlogTagResult, mediaResult, activityResult, homepageResult, workCategoryResult, workItemResult, activityTypeResult].filter((result) => result.error);
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
      coverImage: text(row.cover_image) || undefined, coverImagePosition: text(row.cover_image_position) || undefined, createdAt: Date.parse(text(row.created_at)), createdAtIso: text(row.created_at), updatedAt: text(row.updated_at), status: status(row.status), tagIds: projectTags.get(number(row.id)) ?? [], slug: text(row.slug) || undefined,
      summary: text(row.summary) || undefined, fullDescription: text(row.full_description) || undefined, role: text(row.role) || undefined, developmentStatus: row.development_status as Project["developmentStatus"], releasePeriod: text(row.release_period) || undefined,
      ...projectDetails(row.details),
    }));
    const devlogs: Devlog[] = ((devlogResult.data ?? []) as Row[]).map((row) => ({
      id: number(row.id), title: text(row.title), projectId: row.project_id == null ? undefined : number(row.project_id),
      project: projects.find((project) => project.id === number(row.project_id))?.name ?? "Unassigned",
      date: new Date(text(row.published_at) || text(row.created_at)).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      description: text(row.description), image: text(row.cover_image), images: number(row.image_count ?? 0), comments: 0,
      videos: number(row.video_count ?? 0), time: new Date(text(row.created_at)).toLocaleDateString("en-US"), createdAt: text(row.created_at), updatedAt: text(row.updated_at),
      activityType: text(row.activity_type) || undefined, problemsFaced: row.problems_faced as string[] | undefined, bugsFixed: row.bugs_fixed as string[] | undefined, nextPlans: row.next_plans as string[] | undefined,
      externalLinks: Array.isArray(row.external_links) ? row.external_links as Devlog["externalLinks"] : [], mediaIds: Array.isArray(row.media_ids) ? row.media_ids.map(number) : [], codeSnippets: Array.isArray(row.code_snippets) ? row.code_snippets as Devlog["codeSnippets"] : [],
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
        altText: text(row.alt_text), caption: text(row.caption), order: number(row.sort_order ?? 0), createdAt: text(row.created_at),
      };
    }));
    const activity: ActivityEntry[] = ((activityResult.data ?? []) as Row[]).map((row) => ({
      id: number(row.id), action: row.action as ActivityEntry["action"], entity: row.entity_type as ActivityEntry["entity"],
      title: text(row.title), project: text(row.context), details: text(row.details), timestamp: Date.parse(text(row.created_at)), actorId: text(row.actor_id),
    }));
    const homepage = homepageResult.data?.content as HomepageContent | undefined;
    const workCategories: ProjectWorkCategory[] = ((workCategoryResult.data ?? []) as Row[]).map((row) => ({ id: text(row.id), name: text(row.name), order: number(row.sort_order) }));
    const workItems: ProjectWorkItem[] = ((workItemResult.data ?? []) as Row[]).map((row) => ({
      id: text(row.id), projectId: number(row.project_id), categoryId: text(row.category_id) || undefined, title: text(row.title), description: text(row.description),
      status: row.status as ProjectWorkItem["status"], publicationStatus: status(row.publication_status), startedAt: text(row.started_at) || undefined, completedAt: text(row.completed_at) || undefined,
      mediaIds: Array.isArray(row.media_ids) ? row.media_ids.map(number) : [], links: Array.isArray(row.links) ? row.links as ProjectWorkItem["links"] : [],
      technologyIds: Array.isArray(row.technology_ids) ? row.technology_ids.map(text) : [], order: number(row.sort_order),
    }));

    return { categories, projects, devlogs, tags, media, activity, homepage, workCategories, workItems, activityTypes: ((activityTypeResult.data ?? []) as Row[]).map((row) => text(row.name)) };
  }

  async updateHomepage(content: HomepageContent) {
    const { data, error } = await this.client.from("homepage_content").upsert({ id: content.id, content, updated_at: new Date().toISOString() }).select("content").single();
    if (error) throw error;
    return data.content as HomepageContent;
  }

  async setActivityTypes(values: string[]) {
    const names = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
    const { data: existing, error: selectError } = await this.client.from("activity_types").select("id,name");
    if (selectError) throw selectError;
    const disabled = await Promise.all((existing ?? []).filter((row) => !names.includes(text(row.name))).map((row) => this.client.from("activity_types").update({ enabled: false }).eq("id", row.id)));
    const disableError = disabled.find((result) => result.error)?.error;
    if (disableError) throw disableError;
    if (names.length) {
      const { error } = await this.client.from("activity_types").upsert(names.map((name, sort_order) => ({ name, sort_order, enabled: true })), { onConflict: "name" });
      if (error) throw error;
    }
    return names;
  }

  async createWorkCategory(input: Omit<ProjectWorkCategory, "id">) {
    const { data, error } = await this.client.from("project_work_categories").insert({ name: input.name, sort_order: input.order }).select("*").single();
    if (error) throw error;
    return { id: text(data.id), name: text(data.name), order: number(data.sort_order) };
  }

  async updateWorkCategory(id: string, changes: Partial<Omit<ProjectWorkCategory, "id">>) {
    const { data, error } = await this.client.from("project_work_categories").update({ name: changes.name, sort_order: changes.order }).eq("id", id).select("*").single();
    if (error) throw error;
    return { id: text(data.id), name: text(data.name), order: number(data.sort_order) };
  }

  async deleteWorkCategory(id: string) {
    const { error } = await this.client.from("project_work_categories").delete().eq("id", id);
    if (error) throw error;
  }

  async createWorkItem(input: Omit<ProjectWorkItem, "id">) {
    const { data, error } = await this.client.from("project_work_items").insert({ project_id: input.projectId, category_id: input.categoryId ?? null, title: input.title, description: input.description, status: input.status, publication_status: input.publicationStatus, started_at: input.startedAt ?? null, completed_at: input.completedAt ?? null, media_ids: input.mediaIds, links: input.links, technology_ids: input.technologyIds, sort_order: input.order }).select("*").single();
    if (error) throw error;
    return { ...input, id: text(data.id) };
  }

  async updateWorkItem(id: string, changes: Partial<Omit<ProjectWorkItem, "id">>) {
    const update: Row = {};
    if (changes.projectId !== undefined) update.project_id = changes.projectId;
    if (changes.categoryId !== undefined) update.category_id = changes.categoryId;
    if (changes.title !== undefined) update.title = changes.title;
    if (changes.description !== undefined) update.description = changes.description;
    if (changes.status !== undefined) update.status = changes.status;
    if (changes.publicationStatus !== undefined) update.publication_status = changes.publicationStatus;
    if (changes.startedAt !== undefined) update.started_at = changes.startedAt;
    if (changes.completedAt !== undefined) update.completed_at = changes.completedAt;
    if (changes.mediaIds !== undefined) update.media_ids = changes.mediaIds;
    if (changes.links !== undefined) update.links = changes.links;
    if (changes.technologyIds !== undefined) update.technology_ids = changes.technologyIds;
    if (changes.order !== undefined) update.sort_order = changes.order;
    const { data, error } = await this.client.from("project_work_items").update(update).eq("id", id).select("*").single();
    if (error) throw error;
    return { ...changes, id: text(data.id), projectId: number(data.project_id), categoryId: text(data.category_id) || undefined, title: text(data.title), description: text(data.description), status: data.status as ProjectWorkItem["status"], publicationStatus: status(data.publication_status), startedAt: text(data.started_at) || undefined, completedAt: text(data.completed_at) || undefined, mediaIds: Array.isArray(data.media_ids) ? data.media_ids.map(number) : [], links: Array.isArray(data.links) ? data.links as ProjectWorkItem["links"] : [], technologyIds: Array.isArray(data.technology_ids) ? data.technology_ids.map(text) : [], order: number(data.sort_order) };
  }

  async deleteWorkItem(id: string) {
    const { error } = await this.client.from("project_work_items").delete().eq("id", id);
    if (error) throw error;
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
    const { data, error } = await this.client.from("projects").insert({ category_id: input.categoryId, name: input.name, slug: input.slug, description: input.description, summary: input.summary, full_description: input.fullDescription, role: input.role, development_status: input.developmentStatus, release_period: input.releasePeriod, cover_image: input.coverImage, cover_image_position: input.coverImagePosition, details: projectDetailPayload(input), status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).select("*").single();
    if (error) throw error;
    const id = number(data.id);
    try { await this.replaceAssociations("project_tags", "project_id", id, input.tagIds); }
    catch (associationError) {
      const cleanup = await this.client.from("projects").delete().eq("id", id);
      if (cleanup.error) throw new Error(`${associationError instanceof Error ? associationError.message : "Project tags could not be saved."} (project cleanup failed: ${cleanup.error.message})`, { cause: associationError });
      throw associationError;
    }
    return { ...input, ...projectDetails(data.details), id, createdAt: Date.parse(text(data.created_at)) };
  }

  async updateProject(id: number, changes: Partial<Omit<Project, "id">>) {
    const update: Row = {};
    const extraDetailChanges = Object.keys(projectDetailPayload(changes)).length > 0;
    if (extraDetailChanges) {
      const { data: current, error: currentError } = await this.client.from("projects").select("details").eq("id", id).single();
      if (currentError) throw currentError;
      update.details = { ...((current.details ?? {}) as Row), ...projectDetailPayload(changes) };
    }
    if (changes.categoryId !== undefined) update.category_id = changes.categoryId;
    if (changes.name !== undefined) update.name = changes.name;
    if (changes.slug !== undefined) update.slug = changes.slug;
    if (changes.description !== undefined) update.description = changes.description;
    if (changes.summary !== undefined) update.summary = changes.summary;
    if (changes.fullDescription !== undefined) update.full_description = changes.fullDescription;
    if (changes.role !== undefined) update.role = changes.role;
    if (changes.developmentStatus !== undefined) update.development_status = changes.developmentStatus;
    if (changes.releasePeriod !== undefined) update.release_period = changes.releasePeriod;
    if (changes.coverImage !== undefined) update.cover_image = changes.coverImage;
    if (changes.coverImagePosition !== undefined) update.cover_image_position = changes.coverImagePosition;
    if (changes.status !== undefined) { update.status = changes.status; update.published_at = changes.status === "published" ? new Date().toISOString() : null; }
    const projectResult = Object.keys(update).length
      ? await this.client.from("projects").update(update).eq("id", id).select("*").single()
      : await this.client.from("projects").select("*").eq("id", id).single();
    const { data, error } = projectResult;
    if (error) throw error;
    if (changes.tagIds) await this.replaceAssociations("project_tags", "project_id", id, changes.tagIds);
    const { data: tags, error: tagsError } = await this.client.from("project_tags").select("tag_id").eq("project_id", id);
    if (tagsError) throw tagsError;
      return { ...changes, ...projectDetails(data.details), id, slug: text(data.slug) || undefined, categoryId: number(data.category_id), name: text(data.name), description: text(data.description), coverImage: text(data.cover_image) || undefined, coverImagePosition: text(data.cover_image_position) || undefined, summary: text(data.summary) || undefined, fullDescription: text(data.full_description) || undefined, role: text(data.role) || undefined, developmentStatus: data.development_status as Project["developmentStatus"], releasePeriod: text(data.release_period) || undefined, createdAt: Date.parse(text(data.created_at)), status: status(data.status), tagIds: (tags ?? []).map((row) => number(row.tag_id)) };
  }

  async deleteProject(id: number) {
    const { data: project, error: projectError } = await this.client.from("projects").select("status").eq("id", id).single();
    if (projectError) throw projectError;
    let mediaToRestore: { id: number; published_at: string | null }[] = [];
    if (project.status !== "published") {
      const { data, error: selectMediaError } = await this.client.from("media").select("id,published_at").eq("project_id", id).eq("status", "published");
      if (selectMediaError) throw selectMediaError;
      mediaToRestore = (data ?? []).map((row) => ({ id: number(row.id), published_at: row.published_at == null ? null : text(row.published_at) }));
      const { error: mediaError } = await this.client.from("media").update({ status: "draft", published_at: null }).eq("project_id", id).eq("status", "published");
      if (mediaError) throw mediaError;
    }
    const { error } = await this.client.from("projects").delete().eq("id", id);
    if (error) {
      const restoration = await Promise.all(mediaToRestore.map((item) => this.client.from("media").update({ status: "published", published_at: item.published_at }).eq("id", item.id)));
      const restoreError = restoration.find((result) => result.error)?.error;
      throw new Error(restoreError ? `${error.message} (linked media visibility restore failed: ${restoreError.message})` : error.message);
    }
  }

  async createDevlog(input: Omit<Devlog, "id">) {
    const { data, error } = await this.client.from("devlogs").insert({ project_id: input.projectId ?? null, title: input.title, description: input.description, cover_image: input.image, image_count: input.images, video_count: input.videos ?? 0, activity_type: input.activityType ?? null, problems_faced: input.problemsFaced ?? [], bugs_fixed: input.bugsFixed ?? [], next_plans: input.nextPlans ?? [], external_links: input.externalLinks ?? [], media_ids: input.mediaIds ?? [], code_snippets: input.codeSnippets ?? [], status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).select("*").single();
    if (error) throw error;
    const id = number(data.id);
    await this.replaceAssociations("devlog_tags", "devlog_id", id, input.tagIds);
    return { ...input, id, createdAt: text(data.created_at), updatedAt: text(data.updated_at) };
  }

  async updateDevlog(id: number, changes: Partial<Omit<Devlog, "id">>) {
    const update: Row = {};
    if (changes.projectId !== undefined) update.project_id = changes.projectId;
    if (changes.title !== undefined) update.title = changes.title;
    if (changes.description !== undefined) update.description = changes.description;
    if (changes.image !== undefined) update.cover_image = changes.image;
    if (changes.images !== undefined) update.image_count = changes.images;
    if (changes.videos !== undefined) update.video_count = changes.videos;
    if (changes.activityType !== undefined) update.activity_type = changes.activityType;
    if (changes.problemsFaced !== undefined) update.problems_faced = changes.problemsFaced;
    if (changes.bugsFixed !== undefined) update.bugs_fixed = changes.bugsFixed;
    if (changes.nextPlans !== undefined) update.next_plans = changes.nextPlans;
    if (changes.externalLinks !== undefined) update.external_links = changes.externalLinks;
    if (changes.mediaIds !== undefined) update.media_ids = changes.mediaIds;
    if (changes.codeSnippets !== undefined) update.code_snippets = changes.codeSnippets;
    if (changes.status !== undefined) { update.status = changes.status; update.published_at = changes.status === "published" ? new Date().toISOString() : null; }
    const devlogResult = Object.keys(update).length
      ? await this.client.from("devlogs").update(update).eq("id", id).select("*").single()
      : await this.client.from("devlogs").select("*").eq("id", id).single();
    const { data, error } = devlogResult;
    if (error) throw error;
    if (changes.tagIds) await this.replaceAssociations("devlog_tags", "devlog_id", id, changes.tagIds);
    const linkedProject = data.project_id == null ? null : await this.client.from("projects").select("name").eq("id", data.project_id).maybeSingle();
    if (linkedProject?.error) throw linkedProject.error;
    return {
      id, title: text(data.title), projectId: data.project_id == null ? undefined : number(data.project_id),
      project: changes.project ?? (text(linkedProject?.data?.name) || "Unassigned"), date: new Date(text(data.published_at) || text(data.created_at)).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      description: text(data.description), image: text(data.cover_image), images: number(data.image_count), comments: changes.comments ?? 0,
      videos: number(data.video_count), time: changes.time ?? "Updated", activityType: text(data.activity_type) || undefined, problemsFaced: data.problems_faced as string[] | undefined, bugsFixed: data.bugs_fixed as string[] | undefined, nextPlans: data.next_plans as string[] | undefined, externalLinks: data.external_links as Devlog["externalLinks"], mediaIds: Array.isArray(data.media_ids) ? data.media_ids.map(number) : [], codeSnippets: data.code_snippets as Devlog["codeSnippets"], tagIds: changes.tagIds ?? [], status: status(data.status), createdAt: text(data.created_at), updatedAt: text(data.updated_at),
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

  async createMedia(file: File, input: { name: string; projectId?: number; devlogId?: number; status: "draft" | "published" }) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error("Choose an image or video file.");
    if (file.size > 50 * 1024 * 1024) throw new Error("Files must be 50 MB or smaller.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await this.client.storage.from("beelog-media").upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) throw uploadError;
    const { data, error } = await this.client.from("media").insert({ name: input.name, project_id: input.projectId ?? null, devlog_id: input.devlogId ?? null, storage_path: storagePath, media_type: file.type.startsWith("video/") ? "video" : "image", alt_text: input.name, status: input.status, published_at: input.status === "published" ? new Date().toISOString() : null }).select("*").single();
    if (error) {
      const cleanup = await this.client.storage.from("beelog-media").remove([storagePath]);
      if (cleanup.error) throw new Error(`${error.message}. The uploaded file also needs Storage cleanup: ${cleanup.error.message}`);
      throw error;
    }
    const { data: signed, error: signedError } = await this.client.storage.from("beelog-media").createSignedUrl(storagePath, 3600);
    if (signedError) {
      const metadataCleanup = await this.client.from("media").delete().eq("id", data.id);
      const storageCleanup = await this.client.storage.from("beelog-media").remove([storagePath]);
      const cleanupErrors = [metadataCleanup.error?.message, storageCleanup.error?.message].filter(Boolean);
      throw new Error(`${signedError.message}${cleanupErrors.length ? ` (cleanup also failed: ${cleanupErrors.join("; ")})` : ""}`);
    }
    return { id: number(data.id), name: text(data.name), src: signed.signedUrl, projectId: data.project_id == null ? undefined : number(data.project_id), devlogId: data.devlog_id == null ? undefined : number(data.devlog_id), type: data.media_type === "video" ? "video" as const : "image" as const, status: status(data.status), altText: text(data.alt_text), caption: text(data.caption), createdAt: text(data.created_at) };
  }

  async updateMedia(id: number, changes: Partial<Pick<MediaRecord, "name" | "projectId" | "devlogId" | "status" | "altText" | "caption" | "order">>) {
    const update: Row = {};
    if (changes.name !== undefined) update.name = changes.name;
    if (changes.projectId !== undefined) update.project_id = changes.projectId;
    if (changes.devlogId !== undefined) update.devlog_id = changes.devlogId;
    if (changes.altText !== undefined) update.alt_text = changes.altText;
    if (changes.caption !== undefined) update.caption = changes.caption;
    if (changes.order !== undefined) update.sort_order = changes.order;
    if (changes.status !== undefined) { update.status = changes.status; update.published_at = changes.status === "published" ? new Date().toISOString() : null; }
    const { data, error } = await this.client.from("media").update(update).eq("id", id).select("*").single();
    if (error) throw error;
    const { data: signed, error: signedError } = await this.client.storage.from("beelog-media").createSignedUrl(text(data.storage_path), 3600);
    if (signedError) throw signedError;
    return { id: number(data.id), name: text(data.name), src: signed.signedUrl, projectId: data.project_id == null ? undefined : number(data.project_id), devlogId: data.devlog_id == null ? undefined : number(data.devlog_id), type: data.media_type === "video" ? "video" as const : "image" as const, status: status(data.status), altText: text(data.alt_text), caption: text(data.caption), order: number(data.sort_order), createdAt: text(data.created_at) };
  }

  async deleteMedia(id: number) {
    const { data, error: selectError } = await this.client.from("media").select("*").eq("id", id).single();
    if (selectError) throw selectError;
    const [projectRefs, devlogRefs, workRefs, homepageRefs] = await Promise.all([
      this.client.from("projects").select("id").contains("details", { cover_media_id: id }).limit(1),
      this.client.from("devlogs").select("id").contains("media_ids", [id]).limit(1),
      this.client.from("project_work_items").select("id").contains("media_ids", [id]).limit(1),
      this.client.from("homepage_content").select("id").contains("content", { hero: { imageMediaId: id } }).limit(1),
    ]);
    const referenceErrors = [projectRefs.error, devlogRefs.error, workRefs.error, homepageRefs.error].filter(Boolean);
    if (referenceErrors.length) throw new Error(`Could not verify image references before deletion: ${referenceErrors.map((error) => error?.message).join("; ")}`);
    if (projectRefs.data?.length || devlogRefs.data?.length || workRefs.data?.length || homepageRefs.data?.length) {
      throw new Error("This file is still used by a project, devlog, project contribution, or homepage. Remove those references before deleting it.");
    }
    const { error } = await this.client.from("media").delete().eq("id", id);
    if (error) throw error;
    const { error: storageError } = await this.client.storage.from("beelog-media").remove([text(data.storage_path)]);
    if (storageError) throw new Error(`Media metadata was deleted, but the private Storage object could not be removed: ${storageError.message}`);
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
