import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { getHolidays, type Holiday } from '@/api/services/holiday';
import { Card } from '@/components/ui/Card';
import { Badge, Banner, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { ScreenHeader, SegmentedControl } from '@/components/ui/Layout';
import Screen from '@/components/ui/Screen';
import { colors, font, radius, spacing } from '@/theme';
import { formatDate, todayKey } from '@/utils/format';

type Filter = 'upcoming' | 'past';

/** School holiday calendar — read-only here; holidays are managed in the portal. */
export default function HolidaysScreen() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('upcoming');

  const load = useCallback(async () => {
    setError('');
    try {
      const page = await getHolidays();
      setItems(page.content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load holidays.'));
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

  const { upcoming, past } = useMemo(() => {
    const today = todayKey();
    const sorted = [...items].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));
    return {
      upcoming: sorted.filter((item) => item.holidayDate >= today),
      // Most recent first when looking backwards.
      past: sorted.filter((item) => item.holidayDate < today).reverse(),
    };
  }, [items]);

  const visible = filter === 'upcoming' ? upcoming : past;

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={styles.content}
      header={<ScreenHeader title="Holidays" subtitle={`${items.length} in the calendar`} />}>
      <SegmentedControl<Filter>
        items={[
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'past', label: `Past (${past.length})` },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {error ? <Banner message={error} /> : null}

      {loading ? (
        <SkeletonList rows={5} height={64} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="sunny-outline"
            title={filter === 'upcoming' ? 'No upcoming holidays' : 'No past holidays'}
            description="Holidays published by the school appear here."
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {visible.map((holiday) => {
            const date = new Date(`${holiday.holidayDate}T00:00:00`);
            const isToday = holiday.holidayDate === todayKey();
            return (
              <Card key={holiday.id} style={styles.item}>
                <View style={[styles.dateBox, isToday && styles.dateBoxToday]}>
                  <Text style={[styles.dateDay, isToday && styles.dateTextToday]}>
                    {Number.isNaN(date.getTime()) ? '—' : date.getDate()}
                  </Text>
                  <Text style={[styles.dateMonth, isToday && styles.dateTextToday]}>
                    {Number.isNaN(date.getTime())
                      ? ''
                      : date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemHead}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {holiday.holidayName}
                    </Text>
                    {isToday ? <Badge label="Today" toneName="brand" /> : null}
                  </View>
                  <Text style={styles.itemDate}>
                    {formatDate(holiday.holidayDate)}
                    {Number.isNaN(date.getTime())
                      ? ''
                      : ` · ${date.toLocaleDateString('en-IN', { weekday: 'long' })}`}
                  </Text>
                  {holiday.description ? (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {holiday.description}
                    </Text>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  list: { gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  dateBox: {
    width: 46,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  dateBoxToday: { backgroundColor: colors.brand },
  dateDay: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  dateMonth: {
    fontSize: font.xs - 1,
    fontWeight: '700',
    color: colors.textFaint,
    letterSpacing: 0.5,
  },
  dateTextToday: { color: colors.onBrand },
  itemBody: { flex: 1, gap: 2 },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    flexShrink: 1,
    fontSize: font.md + 1,
    fontWeight: '700',
    color: colors.text,
  },
  itemDate: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  itemDescription: {
    fontSize: font.sm,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
