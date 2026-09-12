import type { AttendanceStatus } from '@/api/services/attendance';
import { colors, type ToneName } from '@/theme';

// ─── Attendance status display ────────────────────────────────────────────────
// Same status→color mapping the web portal uses, so a day that reads green on
// the site reads green here too.

export const STATUS_TONE: Record<AttendanceStatus, ToneName> = {
  PRESENT: 'success',
  LATE: 'warning',
  HALF_DAY: 'warning',
  LOGOUT: 'info',
  ABSENT: 'danger',
  HOLIDAY: 'neutral',
  WEEKEND: 'neutral',
};

export const STATUS_DOT: Record<AttendanceStatus, string> = {
  PRESENT: colors.success,
  LATE: colors.warning,
  HALF_DAY: colors.warning,
  LOGOUT: colors.info,
  ABSENT: colors.danger,
  HOLIDAY: colors.textFaint,
  WEEKEND: colors.borderStrong,
};

export const statusTone = (status?: AttendanceStatus | null): ToneName =>
  (status && STATUS_TONE[status]) || 'neutral';

export const statusDot = (status?: AttendanceStatus | null): string =>
  (status && STATUS_DOT[status]) || colors.textFaint;
