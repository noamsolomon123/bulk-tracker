import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ACTIVITY_LEVELS, SURPLUS_LEVELS } from '../utils/nutrition';
import { colors } from '../theme';

function NumberField({ label, unit, value, onChangeText }) {
  return (
    <View style={styles.numField}>
      <Text style={styles.label}>{label}</Text>
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
          <TouchableOpacity
            key={o[valueKey]}
            style={[styles.chip, isSel && styles.chipSel]}
            onPress={() => onSelect(o[valueKey])}
          >
            <Text style={[styles.chipText, isSel && styles.chipTextSel]}>{o.label}</Text>
          </TouchableOpacity>
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>פרופיל ויעדים</Text>

          <View style={styles.goalCard}>
            <Text style={styles.goalHeading}>היעדים היומיים שלך (עלייה במסה)</Text>
            <View style={styles.goalRow}>
              <View style={styles.goalBox}>
                <Text style={[styles.goalNum, { color: colors.calories }]}>{goals.calories}</Text>
                <Text style={styles.goalUnit}>קק״ל ביום</Text>
              </View>
              <View style={styles.goalBox}>
                <Text style={[styles.goalNum, { color: colors.protein }]}>{goals.protein}</Text>
                <Text style={styles.goalUnit}>גרם חלבון ביום</Text>
              </View>
            </View>
            <Text style={styles.goalNote}>
              מטבוליזם בסיסי {goals.bmr} קק״ל · אחזקה {goals.tdee} קק״ל · מחושב אוטומטית לעודף קלורי.
            </Text>
          </View>

          <View style={styles.rowFields}>
            <NumberField label="גובה" unit="ס״מ" value={profile.heightCm} onChangeText={num('heightCm')} />
            <NumberField label="משקל" unit="ק״ג" value={profile.weightKg} onChangeText={num('weightKg')} />
            <NumberField label="גיל" unit="שנים" value={profile.age} onChangeText={num('age')} />
          </View>

          <Text style={styles.label}>מין</Text>
          <Chips
            options={[{ key: 'male', label: 'זכר' }, { key: 'female', label: 'נקבה' }]}
            valueKey="key"
            selected={profile.sex}
            onSelect={(v) => updateProfile({ sex: v })}
          />

          <Text style={styles.label}>רמת פעילות</Text>
          <Chips
            options={ACTIVITY_LEVELS}
            valueKey="key"
            selected={profile.activity}
            onSelect={(v) => updateProfile({ activity: v })}
          />

          <Text style={styles.label}>עצימות עלייה במסה</Text>
          <Chips
            options={SURPLUS_LEVELS}
            valueKey="key"
            selected={profile.surplus}
            onSelect={(v) => updateProfile({ surplus: v })}
          />

          <Text style={styles.footer}>השינויים נשמרים אוטומטית במכשיר הזה.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 50 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 16 },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
  },
  goalHeading: { color: colors.textDim, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  goalRow: { flexDirection: 'row', gap: 14 },
  goalBox: { flex: 1, backgroundColor: colors.cardAlt, borderRadius: 12, padding: 14, alignItems: 'center' },
  goalNum: { fontSize: 30, fontWeight: '800' },
  goalUnit: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  goalNote: { color: colors.textDim, fontSize: 12, marginTop: 12, lineHeight: 17 },
  rowFields: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  numField: { flex: 1, marginBottom: 14 },
  label: { color: colors.textDim, fontSize: 13, marginBottom: 8, marginTop: 8, fontWeight: '600' },
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  numInput: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 17 },
  unit: { color: colors.textDim, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  chipTextSel: { color: '#fff' },
  footer: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 24 },
});
