import { api, type PageResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { Role } from './auth';

// ─── Attendance service ──────────────────────────────────────────────────────
// The class teacher's roster lookup, GPS check-in/check-out for teachers and
// students, and per-user history. Mirrors the web portal's
// lib/attendanceService.ts — most endpoints return the raw shape (no envelope);
// getUserTodayAttendance is the one exception.

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type AttendanceSource = 'GPS' | 'QR_CODE' | (string & {});

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'LATE'
  | 'HOLIDAY'
  | 'LOGOUT'
  | 'WEEKEND';

export interface ClassTeacherStudent {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
}

export interface ClassTeacherStudentParams {
  /** The class teacher's email — whose roster to fetch. Omit for every student. */
  reqEmail?: string;
  page?: number;
  size?: number;
}

export const getStudentsByClassTeacher = async ({
  reqEmail,
  page = 0,
  size = 20,
}: ClassTeacherStudentParams): Promise<PageResponse<ClassTeacherStudent>> => {
  const response = await api.get<PageResponse<ClassTeacherStudent>>(
    API_ENDPOINTS.ATTENDANCE.ALL_STUDENTS_BY_CLASS_TEACHER,
    { params: { reqEmail: reqEmail || undefined, page, size } },
  );
  return response.data;
};

interface AttendanceBody extends Coordinates {
  attendanceSource: AttendanceSource;
}

/** Checks a student in — called by that student's class teacher, using the teacher's own GPS position. */
export const checkInStudent = async (studentUserId: number, coords: Coordinates): Promise<void> => {
  const body: AttendanceBody = { attendanceSource: 'GPS', ...coords };
  await api.post(API_ENDPOINTS.ATTENDANCE.STUDENT_CHECK_IN, body, { params: { studentUserId } });
};

/** Checks the currently signed-in teacher in. */
export const checkInTeacher = async (coords: Coordinates): Promise<void> => {
  const body: AttendanceBody = { attendanceSource: 'GPS', ...coords };
  await api.post(API_ENDPOINTS.ATTENDANCE.TEACHER_CHECK_IN, body);
};

/** Checks the currently signed-in user out — the endpoint carries no identifier, so it's always self. */
export const checkOut = async (coords: Coordinates): Promise<void> => {
  const body: AttendanceBody = { attendanceSource: 'GPS', ...coords };
  await api.post(API_ENDPOINTS.ATTENDANCE.CHECK_OUT, body);
};

export interface Attendance {
  id: number;
  created: string;
  updated: string;
  name: string;
  attendanceDate: string;
  loginTime: string | null;
  logoutTime: string | null;
  checkinScanLatitude: number | null;
  checkinScanLongitude: number | null;
  checkoutScanLatitude: number | null;
  checkoutScanLongitude: number | null;
  attendanceQRCode: string | null;
  checkIndistanceFromOffice: string | null;
  checkOutdistanceFromOffice: string | null;
  totalWorkingMinutes: number | null;
  minutesLate: number | null;
  status: AttendanceStatus;
  attendanceSource: AttendanceSource;
  remarks: string | null;
  updateBy: string | null;
  active: boolean;
}

export interface UserAttendanceParams {
  userId: number;
  /** Inclusive range bounds, `YYYY-MM-DD`. Omit either to leave that side open. */
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export const getUserAttendance = async ({
  userId,
  startDate,
  endDate,
  page = 0,
  size = 31,
}: UserAttendanceParams): Promise<PageResponse<Attendance>> => {
  const response = await api.get<PageResponse<Attendance>>(API_ENDPOINTS.ATTENDANCE.USER_ALL(userId), {
    params: { startDate, endDate, page, size },
  });
  return response.data;
};

interface AttendanceResultResponse {
  statusCode: number;
  message: string;
  result: Attendance | null;
}

/** Today's record for one user, or null if they haven't been marked yet today. */
export const getUserTodayAttendance = async (userId: number): Promise<Attendance | null> => {
  try {
    const response = await api.get<AttendanceResultResponse>(API_ENDPOINTS.ATTENDANCE.USER_TODAY(userId));
    return response.data.result ?? null;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
};
