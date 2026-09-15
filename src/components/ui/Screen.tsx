import type { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import HeaderBand, { sheetStyle } from '@/components/ui/HeaderBand';
import { useKeyboardAwareScroll } from '@/components/ui/useKeyboardAwareScroll';
import { colors, SCREEN_PADDING, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /**
   * Content for the dark header band (PageTitle, ScreenHeader, HeroHeader). The
   * band stays fixed while the rounded sheet below it scrolls.
   */
  header?: ReactNode;
  /** Wraps the content in a ScrollView (default). Set false for screens that own their own list. */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /**
   * Lifts content above the keyboard. On by default — every screen here has at
   * least one input somewhere, and it costs nothing when no keyboard appears.
   */
  keyboardAvoiding?: boolean;
  /** Dismisses the keyboard when the background is tapped. Only with `scroll`. */
  dismissKeyboardOnTap?: boolean;
  /**
   * Which sides get safe-area padding. Screens inside the tab navigator leave
   * 'bottom' off — the tab bar already covers that inset.
   */
  edges?: readonly Edge[];
  padded?: boolean;
  background?: string;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}

/**
 * Every screen's outer shell: safe-area insets, keyboard avoidance and
 * pull-to-refresh in one place, so no screen has to re-solve them.
 */
export default function Screen({
  children,
  header,
  scroll = true,
  refreshing,
  onRefresh,
  keyboardAvoiding = true,
  dismissKeyboardOnTap = false,
  edges = ['top', 'left', 'right'],
  padded = true,
  background = colors.bg,
  contentStyle,
  style,
}: ScreenProps) {
  const { scrollRef, onScroll, scrollEventThrottle } = useKeyboardAwareScroll();

  const inner = scroll ? (
    <ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      style={styles.flex}
      contentContainerStyle={[
        padded && { paddingHorizontal: SCREEN_PADDING },
        styles.scrollContent,
        !!header && styles.sheetContent,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            colors={[colors.brand]}
            tintColor={colors.brand}
          />
        ) : undefined
      }>
      {dismissKeyboardOnTap ? (
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <View>{children}</View>
        </TouchableWithoutFeedback>
      ) : (
        children
      )}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        padded && { paddingHorizontal: SCREEN_PADDING },
        !!header && styles.sheetContent,
        contentStyle,
      ]}>
      {children}
    </View>
  );

  const body = keyboardAvoiding ? (
    // 'padding' on Android too: the app is edge-to-edge, so the window no
    // longer resizes for the keyboard and `adjustResize` alone does nothing.
    // KeyboardAvoidingView measures its own frame, so it stays correct on
    // devices that do still resize.
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  if (!header) {
    return (
      <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: background }, style]}>
        {body}
      </SafeAreaView>
    );
  }

  // The band paints under the status bar itself, so the top edge is dropped here.
  return (
    <SafeAreaView
      edges={edges.filter((edge) => edge !== 'top')}
      style={[styles.flex, { backgroundColor: background }, style]}>
      <HeaderBand>{header}</HeaderBand>
      <View style={[sheetStyle, { backgroundColor: background }]}>{body}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  sheetContent: { paddingTop: spacing.lg },
});
