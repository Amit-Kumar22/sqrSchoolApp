import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '@/components/ui/Layout';
import { colors, font, radius, spacing } from '@/theme';
import { greeting, longToday } from '@/utils/format';

/**
 * Dashboard header — the espresso→amber band carried over from the portal's
 * sidebar/login chrome, so the app opens on the same brand note as the website.
 */
export default function HeroHeader({
  name,
  roleLabel,
  meta,
  action,
}: {
  name?: string | null;
  roleLabel: string;
  /** Small line under the name — class, employee code, etc. */
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={[colors.brandDeeper, colors.brandDeep, colors.brandDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}>
      <View style={styles.row}>
        <Avatar name={name} size={42} background="rgba(255,255,255,0.16)" />
        <View style={styles.text}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting()}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {name || roleLabel}
          </Text>
        </View>
        {action}
      </View>

      <View style={styles.footer}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{roleLabel}</Text>
        </View>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <Text style={styles.date} numberOfLines={1}>
          {longToday()}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: { flex: 1 },
  greeting: {
    fontSize: font.sm,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  name: {
    fontSize: font.xl + 1,
    fontWeight: '800',
    color: colors.onBrand,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  chipText: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.onBrand,
  },
  meta: {
    flexShrink: 1,
    fontSize: font.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  date: {
    flex: 1,
    textAlign: 'right',
    fontSize: font.xs,
    color: 'rgba(255,255,255,0.65)',
  },
});
