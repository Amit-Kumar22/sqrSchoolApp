import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { getUserAttendance, type Attendance } from '@/api/services/attendance';
import { Banner, Badge, InfoRow } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/Button';
import Sheet from '@/components/ui/Sheet';
import { statusDot, statusTone } from '@/components/attendance/attendanceDisplay';
import { colors, font, radius, spacing } from '@/theme';
import { formatClockTime, formatDuration, formatEnumLabel, todayKey } from '@/utils/format';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const dateKey = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

/**
 * Month grid of one person's attendance, keyed by their user id — used for a
 * student's own history, a teacher's own history, and a teacher viewing one of
 * their students. Tapping a day opens that day's full record.
 */
export default function AttendanceCalendar({ userId }: { userId: number }) {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [records, setRecords] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthDates = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => dateKey(viewYear, viewMonth, i + 1)),
    [daysInMonth, viewYear, viewMonth],
  );
  const today = todayKey();
  const canGoNext = !(viewYear === now.getFullYear() && viewMonth === now.getMonth());

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getUserAttendance({
      userId,
      startDate: monthDates[0],
      endDate: monthDates[monthDates.length - 1],
      size: daysInMonth,
    })
      .then((page) => {
        if (cancelled) return;
        const byDate: Record<string, Attendance> = {};
        for (const record of page.content ?? []) byDate[record.attendanceDate] = record;
        setRecords(byDate);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load attendance for this month.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, viewYear, viewMonth, monthDates, daysInMonth]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const summary = useMemo(() => {
    const values = Object.values(records);
    return {
      present: values.filter((r) => r.status === 'PRESENT' || r.status === 'LOGOUT').length,
      late: values.filter((r) => r.status === 'LATE' || r.status === 'HALF_DAY').length,
      absent: values.filter((r) => r.status === 'ABSENT').length,
    };
  }, [records]);

  const selected = selectedDate ? records[selectedDate] : undefined;

  return (
    <View style={styles.wrap}>
      <View style={styles.monthBar}>
        <IconButton icon="chevron-back" accessibilityLabel="Previous month" onPress={goPrev} size={30} />
        <Text style={styles.monthLabel}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <IconButton
          icon="chevron-forward"
          accessibilityLabel="Next month"
          onPress={goNext}
          disabled={!canGoNext}
          size={30}
        />
      </View>

      {error ? <Banner message={error} /> : null}

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, i) => (
          <Text key={`${day}-${i}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <View style={styles.grid}>
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.cell} />
          ))}
          {monthDates.map((date) => {
            const record = records[date];
            const isFuture = date > today;
            const isToday = date === today;
            return (
              <Pressable
                key={date}
                disabled={isFuture}
                onPress={() => setSelectedDate(date)}
                style={({ pressed }) => [
                  styles.cell,
                  styles.day,
                  isToday && styles.dayToday,
                  pressed && !isFuture && { backgroundColor: colors.brandTint },
                ]}>
                <Text style={[styles.dayNumber, isFuture && styles.dayNumberFuture, isToday && styles.dayNumberToday]}>
                  {Number(date.slice(-2))}
                </Text>
                <View style={[styles.dot, record ? { backgroundColor: statusDot(record.status) } : undefined]} />
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.summary}>
        <SummaryChip color={colors.success} label="Present" value={summary.present} />
        <SummaryChip color={colors.warning} label="Late" value={summary.late} />
        <SummaryChip color={colors.danger} label="Absent" value={summary.absent} />
      </View>

      <Sheet
        visible={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title="Attendance detail"
        subtitle={
          selectedDate
            ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : undefined
        }>
        {selected ? (
          <View style={{ gap: spacing.md }}>
            <Badge label={formatEnumLabel(selected.status)} toneName={statusTone(selected.status)} />
            <View>
              <InfoRow label="Login time" value={formatClockTime(selected.loginTime)} />
              <InfoRow label="Logout time" value={formatClockTime(selected.logoutTime)} />
              <InfoRow label="Working time" value={formatDuration(selected.totalWorkingMinutes)} />
              <InfoRow
                label="Minutes late"
                value={selected.minutesLate === null ? '—' : `${selected.minutesLate}`}
              />
              <InfoRow label="Source" value={formatEnumLabel(selected.attendanceSource)} />
            </View>
            {selected.remarks ? <Text style={styles.remarks}>{selected.remarks}</Text> : null}
          </View>
        ) : (
          <Text style={styles.noRecord}>No attendance record for this date.</Text>
        )}
      </Sheet>
    </View>
  );
}

function SummaryChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.summaryChip}>
      <View style={[styles.summaryDot, { backgroundColor: color }]} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    gap: 3,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
  },
  dayNumber: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumberFuture: { color: colors.borderStrong },
  dayNumberToday: { color: colors.brand, fontWeight: '800' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  loading: { paddingVertical: spacing.xxl },
  summary: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  summaryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryDot: { width: 7, height: 7, borderRadius: radius.pill },
  summaryLabel: { flex: 1, fontSize: font.xs, color: colors.textMuted },
  summaryValue: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  remarks: {
    fontSize: font.sm,
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  noRecord: {
    fontSize: font.md,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
