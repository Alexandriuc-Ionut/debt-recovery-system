const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const error = await res.json().catch(() => ({ message: 'Unauthorized' }));
    const msg = error.message ?? 'Unauthorized';
    // Only redirect to login if this is NOT an auth endpoint (login/register calls return 401 on bad credentials)
    if (!path.startsWith('/auth/')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    throw new Error(msg);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? 'Request failed');
  }

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}
