import type { AccessLog, Bootstrap, Photo, Post, Settings } from '../types';

const TOKEN_KEY = 'rotam.admin.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }

  if (response.status === 204) return undefined as T;

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.error || 'Algo deu errado. Tente novamente.', response.status);
  }
  return data as T;
}

export const api = {
  bootstrap: () => request<Bootstrap>('/api/bootstrap'),
  post: (slug: string) =>
    request<{ post: Post; related: Post[] }>(`/api/posts/${encodeURIComponent(slug)}`),

  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ user: { username: string; role: string } }>('/api/auth/me'),

  adminPosts: () => request<{ posts: Post[] }>('/api/admin/posts'),
  createPost: (payload: Partial<Post>) =>
    request<{ post: Post }>('/api/admin/posts', { method: 'POST', body: JSON.stringify(payload) }),
  updatePost: (id: string, payload: Partial<Post>) =>
    request<{ post: Post }>(`/api/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deletePost: (id: string) =>
    request<{ success: boolean }>(`/api/admin/posts/${id}`, { method: 'DELETE' }),

  adminPhotos: () => request<{ photos: Photo[] }>('/api/admin/photos'),
  createPhoto: (payload: Partial<Photo>) =>
    request<{ photo: Photo }>('/api/admin/photos', { method: 'POST', body: JSON.stringify(payload) }),
  updatePhoto: (id: string, payload: Partial<Photo>) =>
    request<{ photo: Photo }>(`/api/admin/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deletePhoto: (id: string) =>
    request<{ success: boolean }>(`/api/admin/photos/${id}`, { method: 'DELETE' }),

  upload: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const data = await request<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: form,
    });
    return data.url;
  },

  settings: (payload: Partial<Settings>) =>
    request<{ settings: Settings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; token: string }>('/api/admin/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  logs: () => request<{ logs: AccessLog[]; total: number }>('/api/admin/logs'),
  clearLogs: () => request<{ success: boolean }>('/api/admin/logs/clear', { method: 'POST' }),

  visit: (path: string) => {
    try {
      fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, referrer: document.referrer || '' }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* silencioso */
    }
  },
};
