import * as SecureStore from 'expo-secure-store';

// ─── Local read state ────────────────────────────────────────────────────────
// GET /v1/conversations carries no per-user unread count, so "read" is tracked
// on the device — the newest message timestamp seen per conversation. Same
// approach the web portal takes with localStorage. The map is trimmed because
// SecureStore rejects large values.

const KEY = 'sqr.lastRead';
const MAX_ENTRIES = 40;

export type LastReadMap = Record<number, string>;

export async function loadLastRead(userId: number): Promise<LastReadMap> {
  try {
    const raw = await SecureStore.getItemAsync(`${KEY}.${userId}`);
    return raw ? (JSON.parse(raw) as LastReadMap) : {};
  } catch {
    return {};
  }
}

export async function saveLastRead(userId: number, map: LastReadMap): Promise<void> {
  try {
    // Keep the most recently read conversations and drop the tail.
    const entries = Object.entries(map)
      .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, MAX_ENTRIES);
    await SecureStore.setItemAsync(`${KEY}.${userId}`, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Unread badges just won't survive a restart — not worth failing a read for.
  }
}

export function countUnread(
  messages: { senderId: number; createdAt: string }[],
  currentUserId?: number | null,
  lastRead?: string,
): number {
  const since = lastRead ? new Date(lastRead).getTime() : 0;
  return messages.filter(
    (message) => message.senderId !== currentUserId && new Date(message.createdAt).getTime() > since,
  ).length;
}
