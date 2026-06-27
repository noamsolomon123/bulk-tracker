import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius } from '../theme';

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textFaint} {...props} />
    </View>
  );
}

export default function CreateFoodScreen({ navigation }) {
  const { addCustomFood } = useApp();
  const [name, setName] = useState('');
  const [serving, setServing] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const save = () => {
    if (!name.trim()) {
      Alert.alert('נדרש שם', 'אנא הזן שם למזון שלך.');
      return;
    }
    const cal = parseFloat(calories.replace(',', '.'));
    const pro = parseFloat(protein.replace(',', '.'));
    if (isNaN(cal) || cal < 0) {
      Alert.alert('נדרשות קלוריות', 'הזן את הקלוריות למנה אחת.');
      return;
    }
    addCustomFood({ name, servingLabel: serving || 'מנה', calories: cal, protein: isNaN(pro) ? 0 : pro });
    navigation.goBack();
  };

  return (
    <Screen edges={['bottom']} glow="volt">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.overline}>מזון חדש · נשמר במכשיר</Text>
          <Text style={styles.title}>יצירת מזון שלי</Text>
          <Text style={styles.subtitle}>הזן את הערכים התזונתיים למנה אחת. הם נשמרים אצלך וזמינים לשימוש חוזר.</Text>

          <Field label="שם המזון" placeholder="לדוגמה: פנקייק חלבון" value={name} onChangeText={setName} />
          <Field label="תיאור המנה" placeholder="לדוגמה: 2 פנקייק / 100 גרם / כוס" value={serving} onChangeText={setServing} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="קלוריות למנה" placeholder="250" keyboardType="numeric" value={calories} onChangeText={setCalories} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="חלבון למנה (גרם)" placeholder="20" keyboardType="numeric" value={protein} onChangeText={setProtein} />
            </View>
          </View>

          <Button label="שמירת מזון" icon="✓" onPress={save} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  overline: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, color: colors.volt, marginBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.text, marginBottom: 8 },
  subtitle: { fontFamily: fonts.regular, color: colors.textDim, fontSize: 14, marginBottom: 24, lineHeight: 21 },
  row: { flexDirection: 'row', gap: 12 },
  field: { marginBottom: 18 },
  label: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
