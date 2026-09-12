import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Student panel stack — tabs at the root, chat threads pushed on top. */
export default function StudentLayout() {
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
