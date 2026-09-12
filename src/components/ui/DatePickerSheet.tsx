import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Sheet from '@/components/ui/Sheet';
import { IconButton } from '@/components/ui/Button';
import { colors, font, radius, spacing } from '@/theme';
import { todayKey } from '@/utils/format';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

/**
 * Month-grid date picker in a sheet. Written in-app rather than pulling in a
 * native picker so it looks the same on both platforms, matches the attendance
 * calendar, and keeps the project runnable in Expo Go.
 */
export default function DatePickerSheet({
  visible,
  onClose,
  value,
  onSelect,
  title = 'Pick a date',
  minDate,
}: {
  visible: boolean;
  onClose: () => void;
  /** `YYYY-MM-DD`. */
  value?: string;
  onSelect: (date: string) => void;
  title?: string;
  /** Inclusive lower bound, `YYYY-MM-DD` — used to keep a due date on/after its homework date. */
  minDate?: string;
}) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const dates = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => key(viewYear, viewMonth, i + 1)),
    [daysInMonth, viewYear, viewMonth],
  );
  const today = todayKey();

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.wrap}>
        <View style={styles.monthBar}>
          <IconButton icon="chevron-back" accessibilityLabel="Previous month" onPress={goPrev} size={30} />
          <Text style={styles.monthLabel}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <IconButton icon="chevron-forward" accessibilityLabel="Next month" onPress={goNext} size={30} />
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((day, i) => (
            <Text key={`${day}-${i}`} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.cell} />
          ))}
          {dates.map((date) => {
            const selected = date === value;
            const disabled = !!minDate && date < minDate;
            return (
              <View key={date} style={styles.cell}>
                <Pressable
                  disabled={disabled}
                  onPress={() => {
                    onSelect(date);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.day,
                    date === today && !selected && styles.dayToday,
                    selected && styles.daySelected,
                    pressed && !disabled && !selected && { backgroundColor: colors.brandTint },
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      disabled && styles.dayTextDisabled,
                      selected && styles.dayTextSelected,
                    ]}>
                    {Number(date.slice(-2))}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            onSelect(today);
            onClose();
          }}
          style={styles.todayButton}>
          <Text style={styles.todayText}>Today</Text>
        </Pressable>
      </View>
    </Sheet>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.brand,
  },
  daySelected: { backgroundColor: colors.brand },
  dayText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
  },
  dayTextDisabled: { color: colors.borderStrong },
  dayTextSelected: { color: colors.onBrand, fontWeight: '800' },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTint,
  },
  todayText: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.brand,
  },
});
