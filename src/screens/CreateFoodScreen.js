import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textDim}
        {...props}
      />
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
    addCustomFood({
      name,
      servingLabel: serving || '1 serving',
      calories: cal,
      protein: isNaN(pro) ? 0 : pro,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>יצירת מזון שלי</Text>
          <Text style={styles.subtitle}>
            הזן את הערכים התזונתיים למנה אחת. הם נשמרים במכשיר וניתנים לשימוש חוזר.
          </Text>

          <Field
            label="שם המזון"
            placeholder="לדוגמה: פנקייק חלבון"
            value={name}
            onChangeText={setName}
          />
          <Field
            label="תיאור המנה"
            placeholder="לדוגמה: 2 פנקייק / 100 גרם / כוס"
            value={serving}
            onChangeText={setServing}
          />
          <Field
            label="קלוריות למנה (קק״ל)"
            placeholder="לדוגמה: 250"
            keyboardType="numeric"
            value={calories}
            onChangeText={setCalories}
          />
          <Field
            label="חלבון למנה (גרם)"
            placeholder="לדוגמה: 20"
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
          />

          <TouchableOpacity style={styles.save} onPress={save}>
            <Text style={styles.saveText}>שמירת מזון</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: colors.textDim, fontSize: 14, marginBottom: 20, lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { color: colors.textDim, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  save: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
