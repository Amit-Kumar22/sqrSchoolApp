import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, font } from '@/theme';

/**
 * Percentage ring — the app's counterpart to the portal's DonutStat. Drawn with
 * a stroke-dashoffset arc so there's no animation library involved.
 */
export default function Donut({
  percentage,
  label,
  size = 104,
  stroke = 10,
  color = colors.success,
  track = colors.neutralTint,
}: {
  percentage?: number | null;
  label?: string;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percentage ?? 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={track}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            // Start the arc at 12 o'clock instead of 3 o'clock.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="none"
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.value, { fontSize: size * 0.24 }]}>{value}%</Text>
        </View>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: {
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  label: {
    marginTop: 6,
    fontSize: font.xs,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
