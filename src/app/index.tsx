import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';

/**
 * Entry route — sends each session to the panel its role owns, the same mapping
 * as the portal's getDashboardByRole().
 */
export default function Index() {
  const { role } = useAuth();

  if (role === 'TEACHER') return <Redirect href="/teacher/dashboard" />;
  if (role === 'STUDENT') return <Redirect href="/student/dashboard" />;
  return <Redirect href="/login" />;
}
