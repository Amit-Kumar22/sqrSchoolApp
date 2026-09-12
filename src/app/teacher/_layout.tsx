import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Teacher panel stack: the tab navigator is the root screen, and everything
 * else (holidays, chat threads, a student's attendance history) pushes on top
 * of it so the bottom nav stays put for the primary screens only.
 */
export default function TeacherLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
