import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, shadow, spacing } from '@/theme';

/**
 * Structural subset of React Navigation's BottomTabBarProps — typed here rather
 * than imported so the tab bar doesn't reach into expo-router's vendored copy
 * of React Navigation.
 */
export interface TabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        tabBarLabel?: unknown;
        tabBarBadge?: number | string;
        tabBarAccessibilityLabel?: string;
      };
    }
  >;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
}

/** Icon pairs per route name — outline when idle, solid when active. */
const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  dashboard: { on: 'grid', off: 'grid-outline' },
  attendance: { on: 'checkbox', off: 'checkbox-outline' },
  timetable: { on: 'calendar', off: 'calendar-outline' },
  homework: { on: 'book', off: 'book-outline' },
  messages: { on: 'chatbubbles', off: 'chatbubbles-outline' },
  profile: { on: 'person-circle', off: 'person-circle-outline' },
};

export default function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboardUp, setKeyboardUp] = useState(false);

  // Android resizes the window when the keyboard opens, which would otherwise
  // park the nav bar directly on top of the keyboard.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardUp) return null;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key] ?? { options: {} };
        const focused = state.index === index;
        const icon = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
        const label = options.title ?? route.name;
        const badge = options.tabBarBadge;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            style={styles.item}>
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? icon.on : icon.off}
                size={19}
                color={focused ? colors.brand : colors.textFaint}
              />
              {badge !== undefined && badge !== null && badge !== 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {typeof badge === 'number' && badge > 9 ? '9+' : badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 1,
    ...shadow.nav,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    minWidth: 46,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.brandTint },
  badge: {
    position: 'absolute',
    top: -3,
    right: 8,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.onBrand,
  },
  label: {
    fontSize: font.xs - 0.5,
    fontWeight: '600',
    color: colors.textFaint,
  },
  labelActive: { color: colors.brand },
});
