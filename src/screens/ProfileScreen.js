import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { ACTIVITY_LEVELS, SURPLUS_LEVELS } from '../utils/nutrition';
import { colors, fonts, radius } from '../theme';

function NumberField({ label, unit, value, onChangeText }) {
  return (
    <View style={styles.numField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.numRow}>
        <TextInput
          style={styles.numInput}
          keyboardType="numeric"
          value={String(value ?? '')}
          onChangeText={onChangeText}
          selectTextOnFocus
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

function Chips({ options, valueKey, selected, onSelect }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const isSel = selected === o[valueKey];
        return (
          <Pressable key={o[valueKey]} onPress={() => onSelect(o[valueKey])} style={[styles.chip, isSel && styles.chipSel]}>
            <Text style={[styles.chipText, isSel && styles.chipTextSel]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, goals, updateProfile } = useApp();

  const num = (key) => (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    updateProfile({ [key]: cleaned === '' ? '' : Number(cleaned) });
  };

  return (
    <Screen glow="volt">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.overline}>פרופיל · יעדי מסה</Text>
          <Text style={styles.title}>פרופיל ויעדים</Text>

          <Card style={styles.goalCard} padded={false}>
            <Text style={styles.goalHeading}>היעדים היומיים שלך · עלייה במסה</Text>
            <View style={styles.goalRow}>
              <View style={[styles.goalBox, { borderColor: colors.amber }]}>
                <Text style={[styles.goalNum, { color: colors.amber }]}>{goals.calories}</Text>
                <Text style={styles.goalUnit}>קק״ל ביום</Text>
              </View>
              <View style={[styles.goalBox, { borderColor: colors.volt }]}>
                <Text style={[styles.goalNum, { color: colors.volt }]}>{goals.protein}</Text>
                <Text style={styles.goalUnit}>גרם חלבון</Text>
              </View>
            </View>
            <Text style={styles.goalNote}>
              מטבוליזם בסיסי {goals.bmr} · אחזקה {goals.tdee} קק״ל · מחושב אוטומטית לעודף קלורי
            </Text>
          </Card>

          <Text style={styles.section}>נתונים</Text>
          <View style={styles.rowFields}>
            <NumberField label="גובה" unit="ס״מ" value={profile.heightCm} onChangeText={num('heightCm')} />
            <NumberField label="משקל" unit="ק״ג" value={profile.weightKg} onChangeText={num('weightKg')} />
            <NumberField label="גיל" unit="שנים" value={profile.age} onChangeText={num('age')} />
          </View>

          <Text style={styles.section}>מין</Text>
          <Chips
            options={[{ key: 'male', label: 'זכר' }, { key: 'female', label: 'נקבה' }]}
            valueKey="key"
            selected={profile.sex}
            onSelect={(v) => updateProfile({ sex: v })}
          />

          <Text style={styles.section}>רמת פעילות</Text>
          <Chips options={ACTIVITY_LEVELS} valueKey="key" selected={profile.activity} onSelect={(v) => updateProfile({ activity: v })} />

          <Text style={styles.section}>עצימות עלייה במסה</Text>
          <Chips options={SURPLUS_LEVELS} valueKey="key" selected={profile.surplus} onSelect={(v) => updateProfile({ surplus: v })} />

          <Text style={styles.footer}>השינויים נשמרים אוטומטית במכשיר הזה</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 56 },
  overline: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, color: colors.volt, marginBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginBottom: 18 },

  goalCard: { padding: 18, marginBottom: 8 },
  goalHeading: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, color: colors.textDim, marginBottom: 14 },
  goalRow: { flexDirection: 'row', gap: 12 },
  goalBox: {
    flex: 1, backgroundColor: colors.bgElev, borderRadius: radius.md, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1.5,
  },
  goalNum: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38 },
  goalUnit: { fontFamily: fonts.medium, color: colors.textDim, fontSize: 12, marginTop: 3 },
  goalNote: { fontFamily: fonts.regular, color: colors.textFaint, fontSize: 12, marginTop: 14, lineHeight: 18 },

  section: { fontFamily: fonts.display, fontSize: 17, color: colors.text, marginTop: 24, marginBottom: 12 },
  rowFields: { flexDirection: 'row', gap: 10 },
  numField: { flex: 1 },
  fieldLabel: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 12, marginBottom: 8 },
  numRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 12,
  },
  numInput: { flex: 1, paddingVertical: 13, color: colors.text, fontFamily: fonts.extrabold, fontSize: 18 },
  unit: { fontFamily: fonts.medium, color: colors.textDim, fontSize: 12 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 10,
    borderWidth: 1.5, borderColor: colors.border,
  },
  chipSel: { backgroundColor: colors.volt, borderColor: colors.volt },
  chipText: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 13 },
  chipTextSel: { color: colors.ink },
  footer: { fontFamily: fonts.regular, color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 28 },
});
