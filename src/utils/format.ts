// ─── Display formatting ───────────────────────────────────────────────────────
// Shared by every screen so dates, times and labels read the same everywhere.

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` for a Date, in local time (toISOString would shift across midnight). */
export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const todayKey = (): string => toDateKey(new Date());

/** A `YYYY-MM-DD` (or ISO datetime) as "12 Sep 2026". */
export const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Short form — "12 Sep". */
export const formatDateShort = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** ISO datetime -> "09:05 am". */
export const formatClockTime = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/** "HALF_DAY" -> "Half Day". */
export const formatEnumLabel = (value?: string | null): string =>
  (value ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const formatCurrency = (value?: number | null): string => `₹${(value ?? 0).toLocaleString('en-IN')}`;

/** Compact money for stat tiles — "₹1.2L", "₹45.0K". */
export const formatCompactCurrency = (value?: number | null): string => {
  const amount = value ?? 0;
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

export const initialsOf = (name?: string | null): string =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

/** "Good morning" / "Good afternoon" / "Good evening" for the dashboard greeting. */
export const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** "Friday, 12 September" — the dashboard's date line. */
export const longToday = (): string =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

/** A chat timestamp: clock time today, "Yesterday", else a short date. */
export const formatChatTimestamp = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (toDateKey(date) === toDateKey(now)) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (toDateKey(date) === toDateKey(yesterday)) return 'Yesterday';
  return formatDateShort(value);
};

/** Minutes -> "6h 20m". */
export const formatDuration = (minutes?: number | null): string => {
  if (minutes === null || minutes === undefined) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const dayLabel = (day?: string | null): string =>
  day ? day.charAt(0) + day.slice(1).toLowerCase() : '—';
