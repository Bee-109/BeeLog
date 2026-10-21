export type PublicationStatus = "draft" | "published" | "unpublished";

export type ProjectDevelopmentStatus = "in-development" | "on-hold" | "completed" | "released";

export type ExternalLink = {
  id: string;
  label: string;
  url: string;
  type?: string;
};

export type ProjectTechnology = {
  id: string;
  name: string;
  url?: string;
  order: number;
};

export type ProjectStatistic = {
  id: string;
  label: string;
  value: string | number;
  source: "manual" | "calculated" | "external";
  url?: string;
};

export type ProjectWorkCategory = {
  id: string;
  name: string;
  order: number;
};

export type ProjectWorkItem = {
  id: string;
  projectId: number;
  categoryId?: string;
  title: string;
  description: string;
  status?: "planned" | "in-progress" | "complete";
  publicationStatus: PublicationStatus;
  startedAt?: string;
  completedAt?: string;
  mediaIds: number[];
  links: ExternalLink[];
  technologyIds: string[];
  order: number;
};

export type ProjectNote = {
  id: string;
  heading?: string;
  content: string;
  order: number;
};

export type HomepageQuote = {
  id: string;
  text: string;
  author?: string;
  sourceUrl?: string;
  active: boolean;
  order: number;
  placement: "hero" | "sidebar" | "right-panel";
};

export type HomepageSection = {
  id: string;
  title: string;
  description?: string;
  visible: boolean;
  order: number;
};

export type HomepageContent = {
  id: string;
  status: PublicationStatus;
  hero: {
    image?: string;
    imageMediaId?: number;
    imagePosition?: string;
    headline: string;
    subtitle: string;
    actionLabel?: string;
    actionUrl?: string;
    featuredProjectIds: number[];
  };
  quotes: HomepageQuote[];
  sections: HomepageSection[];
  updatedAt: string;
};

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
  coverImagePosition?: string;
  coverMediaId?: number | null;
  createdAt: number;
  status: PublicationStatus;
  pinned?: boolean;
  tagIds: number[];
  slug?: string;
  summary?: string;
  fullDescription?: string;
  role?: string;
  developmentStatus?: ProjectDevelopmentStatus;
  startDate?: string;
  completedDate?: string;
  releasePeriod?: string;
  genres?: string[];
  platforms?: string[];
  technologies?: ProjectTechnology[];
  goals?: string[];
  keyFeatures?: string[];
  workItemIds?: string[];
  problems?: ProjectNote[];
  lessonsLearned?: ProjectNote[];
  futurePlans?: ProjectNote[];
  externalLinks?: ExternalLink[];
  primaryAction?: { label: string; url: string } | null;
  statistics?: ProjectStatistic[];
  createdAtIso?: string;
  updatedAt?: string;
};

export type Devlog = {
  id: number;
  title: string;
  project: string;
  projectId?: number;
  categoryId?: number;
  date: string;
  description: string;
  image: string;
  images: number;
  comments: number;
  videos?: number;
  time: string;
  tagIds: number[];
  status: PublicationStatus;
  createdAt?: string;
  updatedAt?: string;
  activityType?: string;
  problemsFaced?: string[];
  bugsFixed?: string[];
  nextPlans?: string[];
  externalLinks?: ExternalLink[];
  mediaIds?: number[];
  codeSnippets?: { id: string; language?: string; code: string; caption?: string }[];
};

export type MediaRecord = {
  id: number;
  name: string;
  src: string;
  projectId?: number;
  devlogId?: number;
  type: "image" | "video";
  status: PublicationStatus;
  altText?: string;
  caption?: string;
  order?: number;
  externalUrl?: string;
  createdAt?: string;
};

export type ActivityEntry = {
  id: number;
  action: "created" | "edited" | "deleted";
  title: string;
  project: string;
  entity: "Devlog" | "Tag" | "Category" | "Project" | "Media" | "Homepage" | "Activity Type";
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
  homepage?: HomepageContent;
  workCategories?: ProjectWorkCategory[];
  workItems?: ProjectWorkItem[];
  activityTypes?: string[];
};
