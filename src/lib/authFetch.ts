import { getApiUrl, safeJsonParse } from './api-utils';

const API_URL = getApiUrl();

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('mb_token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (res.status === 401) {
    // Only redirect if user token existed (session expired)
    if (token) {
      localStorage.removeItem('mb_token');
      window.location.href = '/login';
    }
  }
  return res;
}

export async function authFetchJson<T = any>(path: string, options: RequestInit = {}): Promise<T | null> {
  const res = await authFetch(path, options);
  if (!res.ok) return null;
  return safeJsonParse(res);
}