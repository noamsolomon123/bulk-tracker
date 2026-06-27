import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

// Surface card with thick warm border and an optional leading accent rail.
export default function Card({ children, style, accent, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {accent ? <View style={[styles.rail, { backgroundColor: accent }]} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: { padding: 18 },
  rail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    insetInlineStart: 0,
    width: 4,
  },
});
