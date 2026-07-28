import { getApiUrl, safeJsonParse } from './api-utils';

const API_URL = getApiUrl();

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('mb_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    window.location.href = '/login';
  }
  return res;
}

export async function authFetchJson<T = any>(path: string, options: RequestInit = {}): Promise<T | null> {
  const res = await authFetch(path, options);
  if (!res.ok) return null;
  return safeJsonParse(res);
}