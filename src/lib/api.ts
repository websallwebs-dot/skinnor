const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '') + '/api';

async function request(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const token = localStorage.getItem('skinnor_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('skinnor_token');
    localStorage.removeItem('skinnor_user');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  if (!res.ok) {
    let errorMsg = `Error ${res.status}`;
    try {
      const body = await res.json();
      errorMsg = body.error || body.message || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return res;
}

export async function get(path: string, params?: Record<string, string | number>): Promise<any> {
  let url = path;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      qs.append(k, String(v));
    }
    url += `?${qs.toString()}`;
  }
  const res = await request(url);
  return res.json();
}

export async function post(path: string, body: any): Promise<any> {
  const isFormData = body instanceof FormData;
  const res = await request(path, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    headers: isFormData
      ? {}
      : { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function put(path: string, body: any): Promise<any> {
  const res = await request(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function del(path: string): Promise<any> {
  const res = await request(path, { method: 'DELETE' });
  return res.json();
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function setToken(token: string) {
  localStorage.setItem('skinnor_token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('skinnor_token');
}

export function removeToken() {
  localStorage.removeItem('skinnor_token');
}

export function setUser(user: any) {
  localStorage.setItem('skinnor_user', JSON.stringify(user));
}

export function getUser(): any | null {
  const raw = localStorage.getItem('skinnor_user');
  return raw ? JSON.parse(raw) : null;
}

export function removeUser() {
  localStorage.removeItem('skinnor_user');
}

export { API_BASE };
