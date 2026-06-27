import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Solid energy block button — bright fill, ink text, tactile press.
export default function Button({ label, onPress, tone = 'volt', icon, style }) {
  const fill = tone === 'amber' ? colors.amber : colors.volt;
  const fillDeep = tone === 'amber' ? colors.amberDeep : colors.voltDeep;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: pressed ? fillDeep : fill, transform: [{ translateY: pressed ? 1 : 0 }] },
        style,
      ]}
    >
      <View style={styles.inner}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, letterSpacing: 0.3 },
  icon: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
});
