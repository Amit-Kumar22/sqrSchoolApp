import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, font, radius, shadow, spacing, tone, type ToneName } from '@/theme';
import { initialsOf } from '@/utils/format';

// ─── Stat tile ────────────────────────────────────────────────────────────────

export function StatCard({
  icon,
  label,
  value,
  toneName = 'brand',
  caption,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  toneName?: ToneName;
  caption?: string;
  style?: ViewStyle;
}) {
  const palette = tone[toneName];
  return (
    <View style={[styles.stat, style]}>
      <View style={[styles.statIcon, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon} size={15} color={palette.fg} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      {caption ? (
        <Text style={styles.statCaption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

/** Two-per-row grid for stat tiles. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  size = 38,
  background = colors.brand,
  color = colors.onBrand,
}: {
  name?: string | null;
  size?: number;
  background?: string;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36, color }]}>{initialsOf(name)}</Text>
    </View>
  );
}

// ─── Tappable list row ────────────────────────────────────────────────────────

export function ListRow({
  icon,
  iconColor = colors.brand,
  iconBackground = colors.brandTint,
  title,
  subtitle,
  right,
  onPress,
  danger = false,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  style?: ViewStyle;
}) {
  const body = (
    <>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: danger ? colors.dangerTint : iconBackground }]}>
          <Ionicons name={icon} size={16} color={danger ? colors.danger : iconColor} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textFaint} /> : null)}
    </>
  );

  if (!onPress) return <View style={[styles.row, style]}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }, style]}>
      {body}
    </Pressable>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  style,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.segment, style]}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}>
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Stack screen header ──────────────────────────────────────────────────────

/** Compact header for pushed screens — back chevron, title, optional action. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  style,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.header, style]}>
      <Pressable
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.headerBack}>
        <Ionicons name="chevron-back" size={19} color={colors.text} />
      </Pressable>
      <View style={styles.headerTitles}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Page title block used at the top of each tab screen. */
export function PageTitle({
  title,
  subtitle,
  right,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.pageTitle, style]}>
      <View style={styles.headerTitles}>
        <Text style={styles.pageTitleText} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md + 2,
    gap: 2,
    ...shadow.card,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: font.xxl,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statCaption: {
    fontSize: font.xs,
    color: colors.textFaint,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontSize: font.md + 1,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: font.sm,
    color: colors.textFaint,
    marginTop: 1,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.neutralTint,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentItemActive: {
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  segmentLabel: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentLabelActive: { color: colors.text },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  headerBack: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { flex: 1 },
  headerTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: font.sm,
    color: colors.textFaint,
    marginTop: 1,
  },
  pageTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  pageTitleText: {
    fontSize: font.display - 2,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
});
