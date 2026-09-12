import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, font, radius, spacing, tone, type ToneName } from '@/theme';

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
  label,
  toneName = 'neutral',
  icon,
  style,
}: {
  label: string;
  toneName?: ToneName;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const palette = tone[toneName];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      {icon ? <Ionicons name={icon} size={11} color={palette.fg} /> : null}
      <Text style={[styles.badgeText, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─── Inline banner ────────────────────────────────────────────────────────────

export function Banner({
  message,
  toneName = 'danger',
  style,
}: {
  message: string;
  toneName?: ToneName;
  style?: ViewStyle;
}) {
  const palette = tone[toneName];
  const icon =
    toneName === 'danger'
      ? 'alert-circle'
      : toneName === 'success'
        ? 'checkmark-circle'
        : toneName === 'warning'
          ? 'warning'
          : 'information-circle';
  return (
    <View style={[styles.banner, { backgroundColor: palette.bg, borderColor: `${palette.fg}33` }, style]}>
      <Ionicons name={icon} size={15} color={palette.fg} />
      <Text style={[styles.bannerText, { color: palette.fg }]}>{message}</Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={20} color={colors.brand} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyText}>{description}</Text> : null}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/** Pulsing placeholder — shown while a screen's first payload is in flight. */
export function Skeleton({
  height = 14,
  width = '100%',
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  style?: ViewStyle;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { height, width, borderRadius: radius.sm, backgroundColor: colors.neutralTint, opacity: pulse },
        style,
      ]}
    />
  );
}

/** A few stacked skeleton rows — the standard "loading a list" placeholder. */
export function SkeletonList({ rows = 3, height = 58 }: { rows?: number; height?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </View>
  );
}

// ─── Key/value row ────────────────────────────────────────────────────────────

export function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: font.xs,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerText: {
    flex: 1,
    fontSize: font.sm,
    lineHeight: 17,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl + 6,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: font.sm,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 17,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: font.sm,
    color: colors.textFaint,
  },
  infoValue: {
    flexShrink: 1,
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
  },
});
