import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { apiErrorMessage } from '@/api/client';
import { getUserTodayAttendance, type Attendance } from '@/api/services/attendance';
import { getProfile } from '@/api/services/auth';
import { useAuth } from '@/auth/AuthContext';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import { statusTone } from '@/components/attendance/attendanceDisplay';
import { Card, SectionCard } from '@/components/ui/Card';
import { Badge, Banner, InfoRow, SkeletonList } from '@/components/ui/Feedback';
import { PageTitle } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { colors, font, radius, spacing } from '@/theme';
import { formatClockTime, formatDuration, formatEnumLabel } from '@/utils/format';

/**
 * Read-only attendance for the student: today's status plus the month
 * calendar. Marking is the class teacher's job, so there are no actions here —
 * same split as the portal.
 */
export default function StudentAttendanceScreen() {
  const { user } = useAuth();
  const [userId, setUserId] = useState<number | null>(user?.id ?? null);
  const [today, setToday] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      // The profile endpoint is the authoritative id — the cached session user
      // could be stale after an account change.
      const profile = await getProfile();
      setUserId(profile.id);
      setToday(await getUserTodayAttendance(profile.id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your attendance.'));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <PageTitle title="Attendance" subtitle="Your daily record" />

      {error ? <Banner message={error} /> : null}

      {loading ? (
        <SkeletonList rows={2} height={120} />
      ) : (
        <>
          <Card style={styles.todayCard}>
            <View style={styles.todayHead}>
              <View style={styles.todayIcon}>
                <Ionicons name="today-outline" size={16} color={colors.brand} />
              </View>
              <View style={styles.todayText}>
                <Text style={styles.todayTitle}>Today</Text>
                <Text style={styles.todayMeta} numberOfLines={1}>
                  {today ? 'Marked by your class teacher' : 'Not marked yet today.'}
                </Text>
              </View>
              {today ? (
                <Badge label={formatEnumLabel(today.status)} toneName={statusTone(today.status)} />
              ) : (
                <Badge label="Pending" toneName="neutral" />
              )}
            </View>

            {today ? (
              <View style={styles.todayGrid}>
                <TodayCell icon="log-in-outline" label="In" value={formatClockTime(today.loginTime)} />
                <TodayCell icon="log-out-outline" label="Out" value={formatClockTime(today.logoutTime)} />
                <TodayCell
                  icon="hourglass-outline"
                  label="Hours"
                  value={formatDuration(today.totalWorkingMinutes)}
                />
              </View>
            ) : null}
          </Card>

          {today ? (
            <SectionCard title="Today's detail" icon="information-circle-outline">
              <InfoRow label="Source" value={formatEnumLabel(today.attendanceSource)} />
              <InfoRow
                label="Minutes late"
                value={today.minutesLate === null ? '—' : `${today.minutesLate}`}
              />
              {today.remarks ? <InfoRow label="Remarks" value={today.remarks} /> : null}
            </SectionCard>
          ) : null}

          <SectionCard title="History" subtitle="Tap a day for details" icon="calendar-outline">
            {userId ? <AttendanceCalendar userId={userId} /> : null}
          </SectionCard>
        </>
      )}
    </Screen>
  );
}

function TodayCell({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.todayCell}>
      <Ionicons name={icon} size={14} color={colors.textFaint} />
      <Text style={styles.todayValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.todayLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  todayCard: { gap: spacing.md },
  todayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  todayIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: { flex: 1 },
  todayTitle: {
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  todayMeta: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  todayGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  todayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  todayValue: {
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  todayLabel: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
});
