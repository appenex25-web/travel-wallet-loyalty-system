import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = '@travel_wallet_token';

export function getApiBase(): string {
  return API_BASE;
}

/** Resolve campaign/image URL so it works on device (replace localhost with API host if needed). */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const base = API_BASE;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
        return base + u.pathname + u.search;
    } catch {
      return url;
    }
    return url;
  }
  return base + (url.startsWith('/') ? url : '/' + url);
}

let memoryToken: string | null = null;

export async function getTokenAsync(): Promise<string | null> {
  if (memoryToken != null) return memoryToken;
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  memoryToken = stored;
  return stored;
}

export function getToken(): string | null {
  return memoryToken;
}

export async function setToken(token: string): Promise<void> {
  memoryToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  memoryToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

const FETCH_TIMEOUT_MS = 20000;

function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /failed to fetch|network request failed|network error|cleartext/i.test(msg);
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = options.token !== undefined ? options.token : await getTokenAsync();
  const { token: _t, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(rest.headers as Record<string, string>),
      },
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (isNetworkError(e)) {
      throw new Error(
        `Cannot reach API at ${API_BASE}. Check: 1) Backend running on PC 2) Phone on same Wi‑Fi 3) In mobile/.env set EXPO_PUBLIC_API_URL to your PC IP (e.g. http://172.20.10.7:3000) then restart Expo.`
      );
    }
    throw e;
  }
  clearTimeout(timeoutId);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || 'Request failed');
  }
  return res.json();
}
