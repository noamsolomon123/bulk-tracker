import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Chunky "plate gauge" macro bar. Fill anchors to the RTL start (right).
export default function FuelBar({ label, value, goal, unit, color = colors.volt, icon }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = value > goal;
  const remaining = Math.max(goal - value, 0);
  const fillColor = over ? colors.ember : color;

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.labelWrap}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.num}>
          <Text style={[styles.value, { color: fillColor }]}>{Math.round(value)}</Text>
          <Text style={styles.goal}> / {Math.round(goal)} {unit}</Text>
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
        <View style={styles.notches} pointerEvents="none">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.notch} />
          ))}
        </View>
      </View>

      <Text style={styles.sub}>
        {over
          ? `${Math.round(value - goal)} ${unit} מעל היעד`
          : `נותרו ${Math.round(remaining)} ${unit}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 9 },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  icon: { fontSize: 15 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, letterSpacing: 0.5 },
  num: { },
  value: { fontFamily: fonts.display, fontSize: 22 },
  goal: { fontFamily: fonts.medium, fontSize: 13, color: colors.textDim },
  track: {
    flexDirection: 'row',
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.sm - 1 },
  notches: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  notch: { width: 2, height: '100%', backgroundColor: colors.bg, opacity: 0.35 },
  sub: { fontFamily: fonts.regular, color: colors.textFaint, fontSize: 12, marginTop: 7 },
});
