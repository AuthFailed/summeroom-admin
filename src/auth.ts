const TOKEN_KEY = 'summeroom.admin.token';
const ADMIN_KEY = 'summeroom.admin.me';

export interface Me {
  id: string;
  email: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getMe(): Me | null {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Me;
  } catch {
    return null;
  }
}

export function saveSession(token: string, me: Me): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(me));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}
