import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Role-based routing, the app's counterpart to the portal's ProtectedRoute +
 * proxy redirect: each panel is a guarded group, so a teacher can never land on
 * a student route (or vice versa) and signing out drops both.
 */
function RootNavigator() {
  const { initializing, role } = useAuth();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync();
  }, [initializing]);

  // Hold the native splash until the stored session has been read — rendering
  // the stack first would flash the login screen at an already-signed-in user.
  if (initializing) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!role}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={role === 'TEACHER'}>
        <Stack.Screen name="teacher" />
      </Stack.Protected>

      <Stack.Protected guard={role === 'STUDENT'}>
        <Stack.Screen name="student" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          {/* Light text for the dark header bands; the login screen mounts its own. */}
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
