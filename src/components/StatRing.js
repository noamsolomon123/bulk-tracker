import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';

// Circular "fuel ring" — the calorie hero. Arc fills clockwise from the top.
export default function StatRing({
  size = 230,
  stroke = 20,
  progress = 0,
  color = colors.amber,
  trackColor = colors.surface3,
  over = false,
  children,
}) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped);
  const arcColor = over ? colors.ember : color;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={cx} originY={cy}>
          <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={arcColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
