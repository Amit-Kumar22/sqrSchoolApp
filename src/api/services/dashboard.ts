import { api, type ApiEnvelope } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { AttendanceStatus } from './attendance';

// ─── Dashboard service ────────────────────────────────────────────────────────
// Teacher and Student dashboard payloads, shaped exactly as the web portal's
// lib/dashboardService.ts declares them. Both use the {statusCode, message,
// result} envelope.

export interface DashboardNotice {
  id: number;
  title: string;
  content: string;
  audience: string;
  priority: string;
  status: string;
  authorName: string;
  publishDate: string;
  expiryDate: string;
}

export interface DashboardTimetableEntry {
  periodName: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  breakPeriod: boolean;
}

export interface LeaveRecord {
  leaveId: number;
  leaveType: string;
  status: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
}

export interface LeaveSummary {
  approvedDays: number;
  pendingCount: number;
  rejectedCount: number;
  recentLeaves: LeaveRecord[];
}

// ─── Teacher dashboard ────────────────────────────────────────────────────────

export interface TeacherDashboardProfile {
  teacherId: number;
  fullName: string;
  employeeCode: string;
  email: string;
  phone: string;
  primarySubject: string;
  qualification: string;
  experienceYears: number;
  assignedClassNames: string[];
}

export interface TeacherAssignedClass {
  classId: number;
  className: string;
  studentCount: number;
  isClassTeacher: boolean;
}

export interface TeacherStudentOverview {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
}

export interface TeacherAttendanceOverview {
  date: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalRecords: number;
  attendancePercentage: number;
}

export interface TeacherExamSummary {
  upcomingExams: number;
  completedExams: number;
  pendingResults: number;
}

export interface TeacherHomeworkSummary {
  totalHomework: number;
  thisWeekHomework: number;
}

export interface TeacherDashboard {
  profile: TeacherDashboardProfile;
  assignedClasses: TeacherAssignedClass[];
  studentOverview: TeacherStudentOverview;
  attendanceOverview: TeacherAttendanceOverview;
  examSummary: TeacherExamSummary;
  todayTimetable: DashboardTimetableEntry[];
  recentNotices: DashboardNotice[];
  homeworkSummary: TeacherHomeworkSummary;
}

export const getTeacherDashboard = async (): Promise<TeacherDashboard> => {
  const response = await api.get<ApiEnvelope<TeacherDashboard>>(API_ENDPOINTS.DASHBOARD.TEACHER);
  return response.data.result;
};

// ─── Student dashboard ────────────────────────────────────────────────────────

export interface StudentDashboardProfile {
  studentId: number;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  academicYear: string;
  dateOfBirth: string;
  gender: string;
  fatherName: string;
  motherName: string;
  parentEmail: string;
  studentEmail: string;
  phone: string;
}

export interface AttendanceRecordEntry {
  date: string;
  status: AttendanceStatus;
  loginTime: string;
  logoutTime: string;
  totalWorkingMinutes: number;
}

export interface StudentAttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  attendancePercentage: number;
  recentAttendance: AttendanceRecordEntry[];
}

export interface StudentFeeSummary {
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  collectionPercentage: number;
}

export interface UpcomingExamEntry {
  examId: number;
  title: string;
  examType: string;
  startDate: string;
  endDate: string;
  status: string;
  className: string;
}

export interface StudentExamSummary {
  totalExams: number;
  passedExams: number;
  failedExams: number;
  upcomingExams: number;
  averagePercentage: number;
  upcomingExamList: UpcomingExamEntry[];
}

export interface ExamResultEntry {
  id: number;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  absent: boolean;
}

export interface StudentDashboard {
  profile: StudentDashboardProfile;
  attendance: StudentAttendanceSummary;
  fees: StudentFeeSummary;
  exams: StudentExamSummary;
  todayTimetable: DashboardTimetableEntry[];
  leave: LeaveSummary;
  recentResults: ExamResultEntry[];
  recentNotices: DashboardNotice[];
}

export const getStudentDashboard = async (): Promise<StudentDashboard> => {
  const response = await api.get<ApiEnvelope<StudentDashboard>>(API_ENDPOINTS.DASHBOARD.STUDENT);
  return response.data.result;
};
