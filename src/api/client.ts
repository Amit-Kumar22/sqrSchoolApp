import axios from 'axios';

import { API_BASE_URL, API_ENDPOINTS } from './endpoints';

// ─── Axios instance ───────────────────────────────────────────────────────────
// The web portal reads its bearer token out of a cookie on every request
// (lib/api.ts). There are no cookies here, so the token is held in memory and
// mirrored into SecureStore by the session store — setAuthToken keeps this
// module's copy in sync, and the request interceptor reads it synchronously.

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Registered once by the auth provider so a 401 anywhere can drop the session. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// Same rule as the web portal: never attach a token to the login call — a stale
// token can make the backend reject the request before it reaches the login check.
api.interceptors.request.use((config) => {
  if (config.url === API_ENDPOINTS.AUTH.LOGIN) return config;
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) onUnauthorized?.();
    return Promise.reject(error);
  },
);

/** Pulls the backend's {message} out of an axios error, falling back when the shape is unexpected. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const axiosError = err as {
    response?: { data?: { message?: string } };
    code?: string;
    message?: string;
  };
  if (axiosError?.response?.data?.message) return axiosError.response.data.message;
  // No response at all — almost always the phone can't reach the server.
  if (!axiosError?.response) {
    if (axiosError?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
    if (axiosError?.message === 'Network Error') {
      return 'Cannot reach the server. Check your internet connection and try again.';
    }
  }
  return fallback;
}

/** Shared envelope shape used by most backend responses. */
export interface ApiEnvelope<T> {
  statusCode: string;
  message: string;
  result: T;
}

/** Spring `Page<T>` shape returned raw (no envelope) by the paginated endpoints. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}
