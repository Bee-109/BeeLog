export type PublicationStatus = "draft" | "published";

export type ProjectCategory = {
  id: number;
  name: string;
  color: string;
  icon: string;
};

/** A real project belongs to a category and may exist without any devlogs. */
export type Project = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  coverImage?: string;
  createdAt: number;
  status: PublicationStatus;
  tagIds: number[];
};

export type Devlog = {
  id: number;
  title: string;
  project: string;
  projectId?: number;
  date: string;
  description: string;
  image: string;
  images: number;
  comments: number;
  videos?: number;
  time: string;
  tagIds: number[];
  status: PublicationStatus;
};

export type MediaRecord = {
  id: number;
  name: string;
  src: string;
  projectId?: number;
  devlogId?: number;
  type: "image" | "video";
  status: PublicationStatus;
};

export type ActivityEntry = {
  id: number;
  action: "created" | "edited" | "deleted";
  title: string;
  project: string;
  entity: "Devlog" | "Tag" | "Category" | "Project" | "Media";
  details?: string;
  timestamp: number;
  actorId?: string;
};

export type DevTag = {
  id: number;
  name: string;
  color: string;
};

export type PortfolioSnapshot = {
  categories: ProjectCategory[];
  projects: Project[];
  devlogs: Devlog[];
  tags: DevTag[];
  media: MediaRecord[];
  activity: ActivityEntry[];
};
