import { api, type PageResponse } from '../client';
import { API_ENDPOINTS } from '../endpoints';

// ─── Holiday service ─────────────────────────────────────────────────────────
// Read-only in the app (the portal's create/edit/delete stays a desk job).
// Returns the raw Page shape — no envelope.

export interface Holiday {
  id: number;
  created: string;
  updated: string;
  holidayName: string;
  holidayDate: string;
  description: string;
  active: boolean;
}

export interface HolidayListParams {
  page?: number;
  size?: number;
}

// Fetched with a generous page size — the list is filtered and grouped
// client-side, same as the portal does.
export const getHolidays = async ({ page = 0, size = 200 }: HolidayListParams = {}): Promise<
  PageResponse<Holiday>
> => {
  const response = await api.get<PageResponse<Holiday>>(API_ENDPOINTS.HOLIDAY.LIST, {
    params: { page, size },
  });
  return response.data;
};
