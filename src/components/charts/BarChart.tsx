import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';
import { EmptyState } from '@/components/ui/Feedback';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

/**
 * Horizontal bars — chosen over vertical columns because category labels read
 * without rotation at phone width. Mirrors the portal's SimpleBarChart data shape.
 */
export default function BarChart({
  data,
  formatValue = (v: number) => `${v}`,
  emptyMessage = 'Nothing to show yet.',
}: {
  data: BarDatum[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return <EmptyState icon="bar-chart-outline" title="No data" description={emptyMessage} />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrap}>
      {data.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.value}>{formatValue(item.value)}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  // Always leave a sliver visible so a zero row still reads as a row.
                  width: `${Math.max(2, (item.value / max) * 100)}%`,
                  backgroundColor: item.color ?? colors.brand,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  row: { gap: 5 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textMuted,
  },
  value: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.text,
  },
  track: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralTint,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
