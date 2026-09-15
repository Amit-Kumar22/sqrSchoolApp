import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { apiErrorMessage } from '@/api/client';
import {
  DAYS_OF_WEEK,
  formatTime,
  getTeacherWeeklyTimetable,
  type DayOfWeek,
  type TeacherWeeklyTimetableEntry,
} from '@/api/services/timetable';
import { Card } from '@/components/ui/Card';
import { Badge, Banner, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { PageTitle } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { colors, font, radius, spacing } from '@/theme';
import { dayLabel } from '@/utils/format';

const GRID_DAYS = DAYS_OF_WEEK.filter((day) => day !== 'SUNDAY');
const JS_DAY_TO_ENUM: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

/** Read-only "My weekly timetable" — the teacher's own periods, one day at a time. */
export default function TeacherTimetableScreen() {
  const today = JS_DAY_TO_ENUM[new Date().getDay()];
  // Sunday has no grid column, so the week opens on Monday instead.
  const [activeDay, setActiveDay] = useState<DayOfWeek>(today === 'SUNDAY' ? 'MONDAY' : today);

  const [entries, setEntries] = useState<TeacherWeeklyTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setEntries(await getTeacherWeeklyTimetable());
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your timetable.'));
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

  const countsByDay = useMemo(() => {
    const counts: Partial<Record<DayOfWeek, number>> = {};
    entries.forEach((entry) => {
      counts[entry.dayOfWeek] = (counts[entry.dayOfWeek] ?? 0) + 1;
    });
    return counts;
  }, [entries]);

  const dayEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.dayOfWeek === activeDay)
        .sort((a, b) => a.periodOrder - b.periodOrder),
    [entries, activeDay],
  );

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={styles.content}
      header={<PageTitle title="Timetable" subtitle={`${entries.length} periods this week`} />}>
      {/* Day strip — horizontal so all six days fit without wrapping. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayStrip}>
        {GRID_DAYS.map((day) => {
          const active = day === activeDay;
          return (
            <Text
              key={day}
              onPress={() => setActiveDay(day)}
              suppressHighlighting
              style={[styles.dayChip, active && styles.dayChipActive]}>
              {dayLabel(day).slice(0, 3)}
              {countsByDay[day] ? ` · ${countsByDay[day]}` : ''}
            </Text>
          );
        })}
      </ScrollView>

      {error ? <Banner message={error} /> : null}

      {loading ? (
        <SkeletonList rows={4} height={76} />
      ) : dayEntries.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar-outline"
            title={`No periods on ${dayLabel(activeDay)}`}
            description={
              entries.length === 0
                ? "You don't have any class periods assigned yet."
                : 'Pick another day to see its schedule.'
            }
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {activeDay === today ? <Badge label="Today" toneName="brand" /> : null}
          {dayEntries.map((entry) => (
            <Card key={entry.id} style={styles.period}>
              <View style={styles.periodTime}>
                <Text style={styles.periodStart}>{formatTime(entry.startTime)}</Text>
                <View style={styles.periodRail} />
                <Text style={styles.periodEnd}>{formatTime(entry.endTime)}</Text>
              </View>

              <View style={styles.periodBody}>
                <View style={styles.periodHead}>
                  <Text style={styles.periodSubject} numberOfLines={1}>
                    {entry.breakPeriod ? 'Break' : entry.subjectName}
                  </Text>
                  {entry.breakPeriod ? <Badge label="Break" toneName="neutral" /> : null}
                </View>
                <View style={styles.periodMetaRow}>
                  <Ionicons name="school-outline" size={12} color={colors.textFaint} />
                  <Text style={styles.periodMeta} numberOfLines={1}>
                    {entry.className} · {entry.periodName}
                  </Text>
                </View>
                {entry.otherTeacherName ? (
                  <View style={styles.periodMetaRow}>
                    <Ionicons name="person-outline" size={12} color={colors.textFaint} />
                    <Text style={styles.periodMeta} numberOfLines={1}>
                      with {entry.otherTeacherName}
                    </Text>
                  </View>
                ) : null}
                {entry.remarks ? (
                  <Text style={styles.periodRemarks} numberOfLines={2}>
                    {entry.remarks}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  dayStrip: { gap: spacing.sm, paddingRight: spacing.md },
  dayChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
    overflow: 'hidden',
  },
  dayChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    color: colors.onBrand,
  },
  list: { gap: spacing.sm },
  period: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  periodTime: {
    width: 64,
    alignItems: 'center',
    gap: 3,
  },
  periodStart: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.text,
  },
  periodRail: {
    width: 2,
    flex: 1,
    minHeight: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  periodEnd: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  periodBody: { flex: 1, gap: 3 },
  periodHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodSubject: {
    flex: 1,
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  periodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodMeta: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textMuted,
  },
  periodRemarks: {
    fontSize: font.xs,
    color: colors.textFaint,
    fontStyle: 'italic',
  },
});
