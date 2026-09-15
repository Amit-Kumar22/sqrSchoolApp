import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, font, gradients, radius, shadow, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** Stretches to the container width — used for form submits. */
  block?: boolean;
  style?: ViewStyle;
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brand, fg: colors.onBrand, border: colors.brand },
  secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.brand, border: 'transparent' },
  danger: { bg: colors.dangerTint, fg: colors.danger, border: colors.dangerBorder },
  success: { bg: colors.success, fg: colors.onBrand, border: colors.success },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  block = false,
  style,
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const isInactive = disabled || loading;
  const isPrimary = variant === 'primary';
  const height = size === 'sm' ? 34 : 46;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: size === 'sm' ? spacing.md + 2 : spacing.xl,
          opacity: isInactive ? 0.55 : pressed ? 0.85 : 1,
        },
        isPrimary && !isInactive && shadow.brand,
        block && styles.block,
        style,
      ]}>
      {isPrimary ? (
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradient]}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={iconSize} color={palette.fg} /> : null}
          <Text
            numberOfLines={1}
            style={[styles.label, { color: palette.fg, fontSize: size === 'sm' ? font.sm : font.md }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Square icon-only button — list rows, headers and pagination. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = colors.textMuted,
  background = colors.surfaceAlt,
  size = 34,
  disabled = false,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  accessibilityLabel: string;
  color?: string;
  background?: string;
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          backgroundColor: background,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}>
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  // Rounded on the fill itself rather than clipping the Pressable, which would
  // also clip the button's glow shadow on iOS.
  gradient: { borderRadius: radius.pill },
  block: { alignSelf: 'stretch' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  iconButton: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
