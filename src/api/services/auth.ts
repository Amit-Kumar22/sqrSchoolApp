import { api, type ApiEnvelope } from '../client';
import { API_ENDPOINTS } from '../endpoints';

export type Role = 'SUPERADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STAFF' | 'STUDENT' | 'ADMIN' | 'PARENT';

// Backend quirk carried over from the web portal: principal accounts come back
// as "ADMIN" over the wire, not "PRINCIPAL". Normalized once at the boundary
// (getProfile) so the rest of the app only ever sees canonical roles.
const ROLE_ALIASES: Record<string, Role> = { ADMIN: 'PRINCIPAL' };

export function normalizeRole(role: string): Role {
  const upper = (role ?? '').toUpperCase();
  return ROLE_ALIASES[upper] ?? (upper as Role);
}

/** Only these two roles have a panel in this app; everyone else is sent to the web portal. */
export const APP_ROLES: Role[] = ['TEACHER', 'STUDENT'];

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  PRINCIPAL: 'Principal',
  TEACHER: 'Teacher',
  STAFF: 'Staff',
  STUDENT: 'Student',
  ADMIN: 'Admin',
  PARENT: 'Parent',
};

// Login does NOT use the {statusCode, message, result} envelope — it returns
// the token and user data flat (same as the web portal's LoginResponse).
export interface LoginResponse {
  accessToken: string;
  data: {
    fullName: string;
    email: string;
    phone: string;
    role: string;
  };
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.delete(API_ENDPOINTS.AUTH.LOGOUT);
};

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: string;
  createdAt: string;
}

/** The authoritative source for role/name — fetched right after login, as on the web. */
export const getProfile = async (): Promise<Profile> => {
  const response = await api.get<ApiEnvelope<Profile>>(API_ENDPOINTS.PROFILE.GET);
  const profile = response.data.result;
  return { ...profile, role: normalizeRole(profile.role) };
};

export interface ProfileAddress {
  buildingName: string;
  streetName: string;
  landmark: string;
  district: string;
  city: string;
  pin: string;
  stateName: string;
}

export interface UpdateProfilePayload {
  name: string;
  phone: string;
  address: ProfileAddress;
}

export const updateProfile = async (data: UpdateProfilePayload): Promise<void> => {
  await api.put<ApiEnvelope<Profile>>(API_ENDPOINTS.PROFILE.UPDATE, data);
};

export interface UpdatePasswordPayload {
  password: string;
  confirmPassword: string;
  code: string;
}

export const updatePassword = async (data: UpdatePasswordPayload): Promise<void> => {
  await api.put<ApiEnvelope<null>>(API_ENDPOINTS.PROFILE.UPDATE_PASSWORD, data);
};
