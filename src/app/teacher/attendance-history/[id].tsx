import { useLocalSearchParams } from 'expo-router';

import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { ScreenHeader } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { spacing } from '@/theme';

/**
 * Month-by-month attendance for one person — the teacher's own record, or one
 * of their students', depending on the id passed in.
 */
export default function AttendanceHistoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const userId = Number(id);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} contentStyle={{ gap: spacing.md }}>
      <ScreenHeader title="Attendance history" subtitle={name || undefined} />
      <Card>
        {Number.isFinite(userId) && userId > 0 ? (
          <AttendanceCalendar userId={userId} />
        ) : (
          <EmptyState title="Nothing to show" description="This person's record could not be opened." />
        )}
      </Card>
    </Screen>
  );
}
