import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Layout';
import { colors, font, radius, spacing } from '@/theme';
import { greeting, longToday } from '@/utils/format';

/**
 * Dashboard header content — greeting, name and role on the navy→forest band.
 * Pass it as `<Screen header>`; the band itself is drawn by the screen.
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
    <View style={styles.hero}>
      <View style={styles.row}>
        <View style={styles.avatarRing}>
          <Avatar name={name} size={42} />
        </View>
        <View style={styles.text}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting()},
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {name || roleLabel}
          </Text>
        </View>
        {action}
      </View>

      <View style={styles.footer}>
        <View style={styles.chip}>
          <View style={styles.chipDot} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.xs,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarRing: {
    padding: 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brandBright,
  },
  text: { flex: 1 },
  greeting: {
    fontSize: font.md,
    color: colors.onChromeMuted,
    fontWeight: '500',
  },
  name: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.onChrome,
    letterSpacing: -0.5,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.chromeGlass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chromeGlassBorder,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.brandBright,
  },
  chipText: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.onChrome,
  },
  meta: {
    flexShrink: 1,
    fontSize: font.xs,
    color: colors.onChromeMuted,
    fontWeight: '600',
  },
  date: {
    flex: 1,
    textAlign: 'right',
    fontSize: font.xs,
    color: colors.onChromeFaint,
  },
});
