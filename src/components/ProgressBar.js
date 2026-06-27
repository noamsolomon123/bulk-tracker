import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function ProgressBar({ label, value, goal, unit, color }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const remaining = Math.max(goal - value, 0);
  const over = value > goal;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={{ color, fontWeight: '700' }}>{Math.round(value)}</Text>
          <Text style={styles.dim}> / {Math.round(goal)} {unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: over ? colors.danger : color },
          ]}
        />
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
  wrap: { marginBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  values: { fontSize: 15 },
  dim: { color: colors.textDim },
  track: { flexDirection: 'row', height: 14, borderRadius: 7, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 4 },
});
