import * as SecureStore from 'expo-secure-store';

import type { Role } from '@/api/services/auth';

// ─── Persisted session ────────────────────────────────────────────────────────
// The web portal keeps the token in a cookie so its server-side proxy can read
// it. There's no server here, so the token and the cached user live in
// SecureStore (Keychain / Android Keystore) instead of plain storage.

const TOKEN_KEY = 'sqr.accessToken';
const USER_KEY = 'sqr.user';

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  status?: string;
}

export interface StoredSession {
  token: string;
  user: SessionUser;
}

export async function saveSession(token: string, user: SessionUser): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function saveUser(user: SessionUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const [token, rawUser] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    if (!token || !rawUser) return null;
    return { token, user: JSON.parse(rawUser) as SessionUser };
  } catch {
    // Unreadable/corrupt entry — treat it as "not signed in" rather than
    // wedging the app on a parse error at launch.
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(USER_KEY).catch(() => {}),
  ]);
}
