import { api, type ApiEnvelope } from '../client';
import { API_ENDPOINTS } from '../endpoints';

// ─── Teacher weekly timetable ────────────────────────────────────────────────
// The teacher-scoped read-only view: the backend resolves the teacher from the
// auth token, so there's no teacherId param — only optional narrowing. Unlike
// the portal's admin timetable list, this one IS wrapped in the envelope.

export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// The backend's LocalTime can serialize as "HH:mm:ss", [h, m] or {hour, minute}
// depending on its Jackson config, so every read goes through parseTime rather
// than assuming one shape (same defensive handling as the web portal).
export type ApiTime = string | number[] | { hour: number; minute: number; second?: number; nano?: number };

function parseTime(value: ApiTime): { hour: number; minute: number } {
  if (typeof value === 'string') {
    const [hour, minute] = value.split(':').map(Number);
    return { hour: hour || 0, minute: minute || 0 };
  }
  if (Array.isArray(value)) return { hour: value[0] ?? 0, minute: value[1] ?? 0 };
  return { hour: value?.hour ?? 0, minute: value?.minute ?? 0 };
}

/** Any ApiTime shape -> "8:00 AM". */
export const formatTime = (value: ApiTime): string => {
  if (value === null || value === undefined) return '—';
  const { hour, minute } = parseTime(value);
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export interface TeacherWeeklyTimetableEntry {
  id: number;
  classId: number;
  className: string;
  periodId: number;
  periodName: string;
  periodOrder: number;
  startTime: ApiTime;
  endTime: ApiTime;
  breakPeriod: boolean;
  dayOfWeek: DayOfWeek;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  remarks: string;
  createdAt: string;
  /** Set when another teacher is also attached to this period; empty otherwise. */
  otherTeacherName: string;
}

export interface TeacherWeeklyTimetableParams {
  classId?: number;
  subjectId?: number;
  dayOfWeek?: DayOfWeek;
}

export const getTeacherWeeklyTimetable = async (
  params: TeacherWeeklyTimetableParams = {},
): Promise<TeacherWeeklyTimetableEntry[]> => {
  const response = await api.get<ApiEnvelope<TeacherWeeklyTimetableEntry[]>>(
    API_ENDPOINTS.WEEKLY_TIMETABLE.TEACHER_LIST,
    { params },
  );
  return response.data.result ?? [];
};
