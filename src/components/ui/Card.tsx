import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, font, radius, shadow, spacing } from '@/theme';

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
}) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Right-aligned affordance in the header — e.g. "View all". */
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  style?: ViewStyle;
  bodyStyle?: ViewStyle;
}

/** Titled panel — the workhorse container for every dashboard block. */
export function SectionCard({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
  children,
  style,
  bodyStyle,
}: SectionCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.sectionHeader}>
        {icon ? (
          <View style={styles.sectionIcon}>
            <Ionicons name={icon} size={14} color={colors.brand} />
          </View>
        ) : null}
        <View style={styles.sectionTitles}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.brand} />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.sectionBody, bodyStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardPadded: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitles: { flex: 1 },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: font.sm,
    color: colors.textFaint,
    marginTop: 1,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionActionText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.brand,
  },
  sectionBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
