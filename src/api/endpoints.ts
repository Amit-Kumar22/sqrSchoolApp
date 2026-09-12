// ─── Backend base URL ─────────────────────────────────────────────────────────
// Same backend the web portal talks to (see the portal's .env.local /
// NEXT_PUBLIC_API_BASE_URL). Override per environment with
// EXPO_PUBLIC_API_BASE_URL in .env — Expo inlines EXPO_PUBLIC_* at build time.

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://76.13.245.49:7979/api';

// ─── API endpoints ────────────────────────────────────────────────────────────
// Mirrors lib/config.ts in the web portal — only the groups the Teacher and
// Student panels actually call are carried over. Paths are copied verbatim,
// including the backend's quirks (attendance lives under /v1/api/..., on top of
// a base URL that already ends in /api).

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    LOGOUT: '/v1/auth/logout',
  },
  PROFILE: {
    GET: '/v1/profile',
    UPDATE: '/v1/profile/update',
    UPDATE_PASSWORD: '/v1/profile/update-password',
  },
  DASHBOARD: {
    TEACHER: '/v1/teacher/dashboard',
    STUDENT: '/v1/student/dashboard',
  },
  ATTENDANCE: {
    ALL_STUDENTS_BY_CLASS_TEACHER: '/v1/api/attendance/all-student-by-class-teacher',
    STUDENT_CHECK_IN: '/v1/api/attendance/student-check-in',
    TEACHER_CHECK_IN: '/v1/api/attendance/teacher-check-in',
    CHECK_OUT: '/v1/api/attendance/check-out',
    USER_ALL: (userId: number) => `/v1/api/attendance/user-all/${userId}`,
    USER_TODAY: (userId: number) => `/v1/api/attendance/user-today/user/${userId}`,
  },
  WEEKLY_TIMETABLE: {
    TEACHER_LIST: '/v1/weekly-timetables/teacher',
  },
  HOME_WORK: {
    CREATE: '/v1/home-work',
    ADD_DAILY: '/v1/home-work/add-daily',
    TEACHER_LIST: '/v1/home-work/teacher',
    DELETE: (id: number) => `/v1/home-work/${id}`,
  },
  HOLIDAY: {
    LIST: '/v1/holiday',
  },
  CONVERSATION: {
    LIST: '/v1/conversations',
    MESSAGES: (id: number) => `/v1/conversations/${id}/messages`,
    READ: (id: number) => `/v1/conversations/${id}/read`,
    CREATE_DIRECT: '/v1/conversations/direct',
    SEND_MESSAGE: '/v1/conversations/send-message',
  },
  ADMIN: {
    ALL_STAFF: '/v1/admin/all-staff',
  },
  THEMES: {
    PUBLIC_ACTIVE: '/v1/free/colour-theme',
  },
} as const;
