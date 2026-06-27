import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Iron-textured backdrop with an optional atmospheric fuel glow.
export default function Screen({ children, edges = ['top'], glow = 'amber' }) {
  const glowColor = glow === 'volt' ? colors.voltGlow : glow === 'amber' ? colors.amberGlow : null;
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgElev, colors.bg, '#100D08']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {glowColor && <View style={[styles.glow, { backgroundColor: glowColor }]} pointerEvents="none" />}
      <View style={styles.hairline} pointerEvents="none" />
      <SafeAreaView style={styles.safe} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  glow: {
    position: 'absolute',
    top: -180,
    alignSelf: 'center',
    width: 460,
    height: 460,
    borderRadius: 460,
  },
  // thin volt seam along the very top edge for a built/engineered feel
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.volt,
    opacity: 0.9,
  },
});
