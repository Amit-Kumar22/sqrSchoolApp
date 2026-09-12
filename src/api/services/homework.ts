import { api, type PageResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';

// ─── Homework service ────────────────────────────────────────────────────────
// A homework record is anchored to one weekly-timetable slot (class + subject +
// period + day) and carries one or more dated notes. Every endpoint here
// returns/accepts the raw entity — no envelope.

export type HomeworkNoteStatus = 'ACTIVE' | 'INACTIVE';

export interface HomeworkNote {
  id: number;
  homeworkDate: string;
  questions: string[];
  status: HomeworkNoteStatus;
}

export interface Homework {
  id: number;
  weeklyTimetableId: number;
  homeworkDate: string;
  dueDate: string;
  className: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: string;
  periodName: string;
  notes: HomeworkNote[];
}

export interface HomeworkPayload {
  /** The weekly-timetable slot this homework is for — see getTeacherWeeklyTimetable. */
  weeklyTimetableId: number;
  notes: { homeworkDate: string; questions: string[] }[];
  homeworkDate: string;
  dueDate: string;
}

export const createHomework = async (data: HomeworkPayload): Promise<Homework> => {
  const response = await api.post<Homework>(API_ENDPOINTS.HOME_WORK.CREATE, data);
  return response.data;
};

export interface DailyNotePayload {
  /** Sent as a query param, not in the body. */
  homeworkId: number;
  homeworkDate: string;
  questions: string[];
}

/** Appends one daily note to an existing homework record. */
export const addDailyHomework = async ({ homeworkId, ...body }: DailyNotePayload): Promise<Homework> => {
  const response = await api.post<Homework>(API_ENDPOINTS.HOME_WORK.ADD_DAILY, body, {
    params: { homeworkId },
  });
  return response.data;
};

export const deleteHomework = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.HOME_WORK.DELETE(id));
};

export interface TeacherHomeworkListParams {
  teacherId: number;
  /** Named per the API spec; in this app's class model the closest id is the class's own id. */
  sectionId?: number;
  subjectId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export const getTeacherHomeworks = async ({
  page = 0,
  size = 10,
  ...params
}: TeacherHomeworkListParams): Promise<PageResponse<Homework>> => {
  const response = await api.get<PageResponse<Homework>>(API_ENDPOINTS.HOME_WORK.TEACHER_LIST, {
    params: { ...params, page, size },
  });
  return response.data;
};
