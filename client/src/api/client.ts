export function getToken() {
  return localStorage.getItem('admin_token');
}
export function setToken(token: string) {
  localStorage.setItem('admin_token', token);
}
export function clearToken() {
  localStorage.removeItem('admin_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers as Record<string, string> || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    setupNeeded: () => request<{ setupNeeded: boolean }>('/auth/setup-needed'),
    setup: (body: { username: string; password: string }) =>
      request<{ token: string; username: string }>('/auth/setup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { username: string; password: string }) =>
      request<{ token: string; username: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<{ username: string }>('/auth/me'),
  },
  blog: {
    getPosts: () => request<any[]>('/blog/posts'),
    getPost: (slug: string) => request<any>(`/blog/posts/${slug}`),
    adminGetPosts: () => request<any[]>('/blog/admin/posts'),
    adminGetPost: (id: number) => request<any>(`/blog/admin/posts/${id}`),
    create: (data: any) => request<any>('/blog/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/blog/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    togglePublish: (id: number) => request<any>(`/blog/posts/${id}/publish`, { method: 'PATCH' }),
    delete: (id: number) => request<any>(`/blog/posts/${id}`, { method: 'DELETE' }),
  },
  profile: {
    getAll: () => request<Record<string, any>>('/profile'),
    getSection: (section: string) => request<any>(`/profile/${section}`),
    updateSection: (section: string, data: any) =>
      request<any>(`/profile/${section}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  medium: {
    getArticles: () => request<{ articles: any[]; mediumUsername: string }>('/medium/articles'),
    sync: () => request<any>('/medium/sync', { method: 'POST' }),
  },
  ai: {
    chat: (message: string) =>
      request<{ response: string; model: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  },
};
