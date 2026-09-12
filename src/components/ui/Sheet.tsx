import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardAwareScroll } from '@/components/ui/useKeyboardAwareScroll';
import { colors, font, radius, spacing } from '@/theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Pinned action row at the bottom, outside the scroll area. */
  footer?: ReactNode;
}

/**
 * Bottom sheet used for every form and detail popup in the app. It handles the
 * keyboard itself (forms live in here) and pads for the home indicator, so
 * callers only supply content.
 */
export default function Sheet({ visible, onClose, title, subtitle, children, footer }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { scrollRef, onScroll, scrollEventThrottle } = useKeyboardAwareScroll();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tap-outside-to-close sits behind the panel, never over it. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {/* 'padding' on both platforms — under edge-to-edge Android the window
            no longer resizes for the keyboard, so behavior:undefined would let
            the sheet's fields sit behind it. */}
        <KeyboardAvoidingView behavior="padding" style={styles.avoider}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <View style={styles.headerTitles}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.close}>
                <Ionicons name="close" size={17} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              onScroll={onScroll}
              scrollEventThrottle={scrollEventThrottle}
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Single-choice picker rendered in a sheet — the app's replacement for <select>. */
export function OptionSheet<T extends string | number>({
  visible,
  onClose,
  title,
  options,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { value: T; label: string; description?: string }[];
  selected?: T;
  onSelect: (value: T) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.options}>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && { opacity: 0.8 },
              ]}>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && { color: colors.brand }]} numberOfLines={2}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={styles.optionDescription} numberOfLines={1}>
                    {option.description}
                  </Text>
                ) : null}
              </View>
              {active ? <Ionicons name="checkmark-circle" size={18} color={colors.brand} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  avoider: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitles: { flex: 1 },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.textFaint,
    marginTop: 1,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 0 },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  optionActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: font.md + 1,
    fontWeight: '600',
    color: colors.text,
  },
  optionDescription: {
    fontSize: font.xs,
    color: colors.textFaint,
    marginTop: 1,
  },
});
