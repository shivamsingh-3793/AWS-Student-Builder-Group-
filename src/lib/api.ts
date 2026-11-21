import type {
  AdminUser,
  CommunityStats,
  EventItem,
  GalleryItem,
  PostItem,
  ProjectItem,
  StatsResponse,
  SubmissionItem,
  TeamCategory,
  TeamMember,
} from '../types';

const API_BASE =
  (
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.NEXT_PUBLIC_API_URL as string | undefined) ||
    ''
  ).replace(/\/$/, '');

const TOKEN_STORAGE_KEY = 'stratus_admin_token';
let legacyTokenCleared = false;

export function getAuthToken(): string | null {
  try {
    if (!legacyTokenCleared) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      legacyTokenCleared = true;
    }
  } catch {
    legacyTokenCleared = true;
  }
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('https://') || url.startsWith('http://')) return url;
  if (url.startsWith('/uploads/') && API_BASE) {
    return `${API_BASE}${url}`;
  }
  if (/^\/(?!\/)[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp|gif)$/i.test(url)) return url;
  return '';
}

export const configApi = {
  get: () => request<{ cmsName: string }>('/api/config'),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (response.status === 401 && !path.startsWith('/api/auth/login')) {
    clearAuthToken();
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      window.location.assign('/admin/login');
    }
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw new Error(
      'The API returned a non-JSON response. Check that the backend is running, the API route is available, and the Supabase schema is applied.',
    );
  }

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (data === null || typeof data !== 'object') {
    throw new Error('The API returned an empty or invalid response.');
  }

  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: AdminUser }>('/api/auth/me'),
  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const eventsApi = {
  list: (all = false) => request<{ events: EventItem[] }>(`/api/events${all ? '?all=true' : ''}`),
  get: (idOrSlug: string | number) =>
    request<{ event: EventItem; related: EventItem[] }>(`/api/events/${idOrSlug}`),
  create: (payload: Partial<EventItem>) =>
    request<{ event: EventItem; message: string }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Partial<EventItem>) =>
    request<{ event: EventItem; message: string }>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<{ message: string }>(`/api/events/${id}`, { method: 'DELETE' }),
};

export const postsApi = {
  list: (all = false) => request<{ posts: PostItem[] }>(`/api/posts${all ? '?all=true' : ''}`),
  get: (slugOrId: string | number) =>
    request<{ post: PostItem; related: PostItem[] }>(`/api/posts/${slugOrId}`),
  create: (payload: Partial<PostItem>) =>
    request<{ post: PostItem; message: string }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Partial<PostItem>) =>
    request<{ post: PostItem; message: string }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<{ message: string }>(`/api/posts/${id}`, { method: 'DELETE' }),
};

export const projectsApi = {
  list: (all = false) =>
    request<{ projects: ProjectItem[] }>(`/api/projects${all ? '?all=true' : ''}`),
  get: (id: string | number) =>
    request<{ project: ProjectItem; related: ProjectItem[] }>(`/api/projects/${id}`),
  create: (payload: Partial<ProjectItem>) =>
    request<{ project: ProjectItem; message: string }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: Partial<ProjectItem>) =>
    request<{ project: ProjectItem; message: string }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<{ message: string }>(`/api/projects/${id}`, { method: 'DELETE' }),
};

export const galleryApi = {
  list: () => request<{ gallery: GalleryItem[] }>('/api/gallery'),
  upload: (formData: FormData) =>
    request<{ item: GalleryItem; message: string }>('/api/gallery', {
      method: 'POST',
      body: formData,
    }),
  update: (id: number, payload: { title: string; category?: string }) =>
    request<{ item: GalleryItem; message: string }>(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<{ message: string }>(`/api/gallery/${id}`, { method: 'DELETE' }),
};

export const teamApi = {
  list: async (all = false, category?: TeamCategory) => {
    const params = new URLSearchParams();
    if (all) params.set('all', 'true');
    if (category) params.set('category', category);
    const query = params.toString();
    const response = await request<{ members: TeamMember[] }>(
      `/api/team${query ? `?${query}` : ''}`,
      {
        cache: 'no-store',
      },
    );
    if (!Array.isArray(response.members)) {
      throw new Error('The Team API returned an invalid members list.');
    }
    return response;
  },
  create: (formData: FormData) =>
    request<{ member: TeamMember; message: string; warning?: string }>('/api/team', {
      method: 'POST',
      body: formData,
    }),
  update: (id: number, formData: FormData) =>
    request<{ member: TeamMember; message: string; warning?: string }>(`/api/team/${id}`, {
      method: 'PATCH',
      body: formData,
    }),
  remove: (id: number) =>
    request<{ message: string; warning?: string }>(`/api/team/${id}`, { method: 'DELETE' }),
};

export const uploadApi = {
  uploadImage: (file: File, scope: 'events' | 'posts' | 'projects' | 'gallery' | 'team') => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ url: string; filename: string; size: number }>(`/api/upload?scope=${scope}`, {
      method: 'POST',
      body: formData,
    });
  },
};

export const statsApi = {
  get: () => request<StatsResponse>('/api/stats'),
  update: (payload: CommunityStats) =>
    request<{ community: CommunityStats; message: string }>('/api/stats', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export const communityApi = {
  join: (payload: {
    name: string;
    email: string;
    role?: string;
    track?: string;
    message?: string;
    event_id?: number | null;
  }) =>
    request<{ message: string }>('/api/community/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  contact: (payload: { name: string; email: string; role?: string; message: string }) =>
    request<{ message: string }>('/api/community/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submissions: () => request<{ submissions: SubmissionItem[] }>('/api/community/submissions'),
};
