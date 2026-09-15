import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radius, SCREEN_PADDING, spacing } from '@/theme';

/** How far the content sheet rides up over the band's bottom edge. */
export const SHEET_OVERLAP = 18;

/**
 * The navy→forest band at the top of every signed-in screen. It paints under
 * the status bar itself (so callers must not add a top safe-area edge) and
 * leaves room at the bottom for the rounded content sheet to overlap it.
 */
export default function HeaderBand({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.chrome}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.band, { paddingTop: insets.top + spacing.sm }, style]}>
      {/* Soft green glow in the corner — decoration only. */}
      <View pointerEvents="none" style={styles.glowLarge} />
      <View pointerEvents="none" style={styles.glowSmall} />
      {children}
    </LinearGradient>
  );
}

export const sheetStyle: ViewStyle = {
  flex: 1,
  marginTop: -SHEET_OVERLAP,
  borderTopLeftRadius: radius.xl,
  borderTopRightRadius: radius.xl,
  backgroundColor: colors.bg,
  overflow: 'hidden',
};

const styles = StyleSheet.create({
  band: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: SHEET_OVERLAP + spacing.lg,
    overflow: 'hidden',
  },
  glowLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
    backgroundColor: colors.brandBright,
    opacity: 0.1,
  },
  glowSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -30,
    right: -20,
    backgroundColor: colors.brandBright,
    opacity: 0.08,
  },
});
