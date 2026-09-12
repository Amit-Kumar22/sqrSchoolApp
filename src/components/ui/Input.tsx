import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, font, radius, spacing } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
  /** Renders the eye toggle and hides input by default. */
  secure?: boolean;
  containerStyle?: ViewStyle;
}

export function TextField({
  label,
  icon,
  error,
  hint,
  secure = false,
  containerStyle,
  style,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          !!error && styles.inputWrapError,
          inputProps.multiline && styles.inputWrapMultiline,
        ]}>
        {icon ? (
          <Ionicons name={icon} size={16} color={focused ? colors.brand : colors.textFaint} />
        ) : null}
        <TextInput
          {...inputProps}
          secureTextEntry={secure && !revealed}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, inputProps.multiline && styles.inputMultiline, style]}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

/** Read-only field that opens a picker/sheet when tapped. */
export function SelectField({
  label,
  value,
  placeholder = 'Select',
  icon = 'chevron-down',
  onPress,
  disabled = false,
  containerStyle,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.inputWrap,
          { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.selectValue, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={15} color={colors.textFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 5 },
  label: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  inputWrap: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  inputWrapFocused: {
    borderColor: colors.brand,
    // A hairline border can't carry a focus ring on Android, so the focused
    // state doubles as a subtle tint instead.
    backgroundColor: colors.brandTint,
  },
  inputWrapError: { borderColor: colors.danger },
  inputWrapMultiline: { alignItems: 'flex-start', paddingVertical: spacing.md },
  input: {
    flex: 1,
    fontSize: font.md + 1,
    color: colors.text,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 76,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  selectValue: {
    flex: 1,
    fontSize: font.md + 1,
    color: colors.text,
    fontWeight: '500',
  },
  selectPlaceholder: { color: colors.textFaint, fontWeight: '400' },
  error: { fontSize: font.xs, color: colors.danger, fontWeight: '500' },
  hint: { fontSize: font.xs, color: colors.textFaint },
});
