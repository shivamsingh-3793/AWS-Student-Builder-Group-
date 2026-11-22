export interface EventItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  event_date: string;
  location: string;
  type: string;
  image_url: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: string;
  image_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  tech_stack: string;
  image_url: string;
  project_url: string;
  architecture_url: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
}

export type TeamCategory = 'leader' | 'core' | 'member' | 'former';

export interface TeamMember {
  id: number;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
  category: TeamCategory;
  linkedin: string;
  github: string;
  instagram: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityStats {
  builders_count: number;
  events_count: number;
  projects_count: number;
  workshops_count: number;
}

export interface CmsStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalProjects: number;
  publishedProjects: number;
  totalGallery: number;
  totalSubmissions: number;
}

export interface StatsResponse {
  community: CommunityStats | null;
  cms?: CmsStats;
}

export interface SubmissionItem {
  id: number;
  kind: string;
  name: string;
  email: string;
  role: string;
  track: string;
  message: string;
  event_id: number | null;
  event_title?: string | null;
  created_at: string;
  status: SubmissionStatus;
}

export type SubmissionStatus = 'new' | 'read' | 'reviewed';
export type SubmissionKind = 'join' | 'event_rsvp' | 'contact';
export type SubmissionSort = 'newest' | 'oldest';

export interface SubmissionQuery {
  page?: number;
  pageSize?: number;
  sort?: SubmissionSort;
  kind?: SubmissionKind;
  status?: SubmissionStatus;
  search?: string;
}

export interface SubmissionPage {
  submissions: SubmissionItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}
