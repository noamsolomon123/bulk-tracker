import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TextInput, Pressable, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/notifications';
import { testGeminiKey } from '../utils/gemini';
import { colors, fonts, radius } from '../theme';

const TEST_ERRORS = {
  NO_KEY: 'לא הוזן מפתח.',
  BAD_KEY: 'המפתח שגוי או נדחה.',
  NETWORK: 'אין חיבור לאינטרנט.',
};

export default function SettingsScreen() {
  const { settings, setRemindersEnabled, setGeminiKey, addReminder, updateReminder, deleteReminder, renameReminder } = useApp();
  const [busy, setBusy] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [picker, setPicker] = useState(null); // { id, hour, minute }
  const [test, setTest] = useState(null); // 'loading' | { ok, msg }
  const hasKey = !!(settings.geminiKey && settings.geminiKey.trim());

  const onToggleMaster = async (value) => {
    setBusy(true);
    const ok = await setRemindersEnabled(value);
    setBusy(false);
    if (value && !ok) {
      Alert.alert('ההתראות חסומות', 'אפשר הרשאת התראות לאפליקציה הזו בהגדרות המכשיר כדי לקבל תזכורות.');
    }
  };

  const runTest = async () => {
    setTest('loading');
    try {
      await testGeminiKey(settings.geminiKey);
      setTest({ ok: true, msg: 'המפתח עובד ✓' });
    } catch (e) {
      if (e.message === 'RATE_LIMIT') setTest({ ok: true, msg: 'המפתח תקין (המכסה מלאה כרגע)' });
      else setTest({ ok: false, msg: TEST_ERRORS[e.message] || 'שגיאה בבדיקה.' });
    }
  };

  return (
    <Screen glow="volt">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.overline}>הגדרות · התאמה אישית</Text>
        <Text style={styles.title}>הגדרות</Text>

        {/* ── Reminders ── */}
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingEnd: 14 }}>
              <Text style={styles.rowLabel}>תזכורות ארוחה</Text>
              <Text style={styles.rowSub}>התראות מקומיות שיזכירו לך לאכול ולרשום. הפעל מתג ראשי, וכוונן כל ארוחה בנפרד.</Text>
            </View>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={onToggleMaster}
              disabled={busy}
              trackColor={{ true: colors.volt, false: colors.surface3 }}
              thumbColor={settings.remindersEnabled ? colors.ink : '#E8E0CE'}
              ios_backgroundColor={colors.surface3}
            />
          </View>
        </Card>

        <Text style={styles.section}>הארוחות שלי</Text>
        <Card padded={false}>
          {settings.reminderTimes.map((t, i) => (
            <View key={t.id} style={[styles.mealRow, i > 0 && styles.mealBorder]}>
              <Switch
                value={t.enabled}
                onValueChange={(v) => updateReminder(t.id, { enabled: v })}
                trackColor={{ true: colors.volt, false: colors.surface3 }}
                thumbColor={t.enabled ? colors.ink : '#E8E0CE'}
                ios_backgroundColor={colors.surface3}
                style={styles.mealSwitch}
              />
              <TextInput
                style={[styles.mealLabel, !t.enabled && styles.mealDim]}
                value={t.label}
                onChangeText={(txt) => renameReminder(t.id, txt)}
                placeholder="שם הארוחה"
                placeholderTextColor={colors.textFaint}
              />
              <Pressable onPress={() => setPicker({ id: t.id, hour: t.hour, minute: t.minute })} style={styles.timeBtn}>
                <Text style={[styles.timeTxt, !t.enabled && styles.mealDim]}>{formatTime(t)}</Text>
              </Pressable>
              <Pressable onPress={() => deleteReminder(t.id)} hitSlop={8} style={styles.del}>
                <Text style={styles.delTxt}>✕</Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addRow} onPress={() => addReminder({ label: 'ארוחה חדשה', hour: 10, minute: 0 })}>
            <Text style={styles.addTxt}>＋ הוסף תזכורת</Text>
          </Pressable>
        </Card>
        <Text style={styles.note}>
          {settings.remindersEnabled ? 'התזכורות הפעילות חוזרות מדי יום.' : 'הפעל את המתג הראשי למעלה כדי שהתזכורות יפעלו.'}
        </Text>

        {/* ── AI key ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.section}>חיפוש מזון עם AI</Text>
          <View style={[styles.statusPill, { backgroundColor: hasKey ? colors.volt : colors.surface3 }]}>
            <Text style={[styles.statusText, { color: hasKey ? colors.ink : colors.textDim }]}>{hasKey ? 'פעיל ✓' : 'לא הוגדר'}</Text>
          </View>
        </View>
        <Card>
          <Text style={styles.rowSub}>הדבק מפתח Gemini API לחיפוש מזונות שאינם ברשימה. נשמר רק במכשיר שלך.</Text>
          <View style={styles.keyRow}>
            <TextInput
              style={styles.keyInput}
              placeholder="מפתח Gemini API"
              placeholderTextColor={colors.textFaint}
              value={settings.geminiKey}
              onChangeText={(t) => { setGeminiKey(t); setTest(null); }}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable style={styles.keyToggle} onPress={() => setShowKey((s) => !s)}>
              <Text style={styles.keyToggleText}>{showKey ? 'הסתר' : 'הצג'}</Text>
            </Pressable>
          </View>
          <View style={styles.testRow}>
            <Pressable style={[styles.testBtn, !hasKey && styles.testDisabled]} onPress={runTest} disabled={!hasKey || test === 'loading'}>
              <Text style={styles.testBtnTxt}>{test === 'loading' ? 'בודק…' : 'בדוק מפתח'}</Text>
            </Pressable>
            {test && test !== 'loading' ? (
              <Text style={[styles.testResult, { color: test.ok ? colors.volt : colors.ember }]}>{test.msg}</Text>
            ) : null}
          </View>
          <Pressable onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}>
            <Text style={styles.link}>קבל מפתח חינמי ב‑Google AI Studio ↗</Text>
          </Pressable>
        </Card>

        <Card style={styles.privacyCard} accent={colors.volt} padded={false}>
          <View style={styles.privacyPad}>
            <Text style={styles.privacyTitle}>🔒 פרטיות מלאה</Text>
            <Text style={styles.privacyText}>כל הנתונים שלך — פרופיל, מזונות, יומן ומפתח ה‑AI — נשמרים 100% מקומית במכשיר. שום דבר לא נשלח לשרת.</Text>
          </View>
        </Card>
      </ScrollView>

      {picker ? (
        <DateTimePicker
          value={new Date(2020, 0, 1, picker.hour, picker.minute)}
          mode="time"
          is24Hour
          display="spinner"
          onChange={(event, date) => {
            const sel = picker;
            setPicker(null);
            if (event.type === 'set' && date) {
              updateReminder(sel.id, { hour: date.getHours(), minute: date.getMinutes() });
            }
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  overline: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, color: colors.volt, marginBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginBottom: 18 },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontFamily: fonts.bold, color: colors.text, fontSize: 17 },
  rowSub: { fontFamily: fonts.regular, color: colors.textDim, fontSize: 13, marginTop: 5, lineHeight: 19 },

  section: { fontFamily: fonts.display, fontSize: 17, color: colors.text, marginTop: 26, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },

  mealRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  mealBorder: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  mealSwitch: { transform: [{ scale: 0.85 }] },
  mealLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text, paddingVertical: 4 },
  mealDim: { color: colors.textFaint },
  timeBtn: { backgroundColor: colors.bg, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1.5, borderColor: colors.border },
  timeTxt: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.volt, letterSpacing: 0.5 },
  del: { padding: 4 },
  delTxt: { fontFamily: fonts.bold, fontSize: 16, color: colors.ember },
  addRow: { padding: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft, alignItems: 'center' },
  addTxt: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.volt },
  note: { fontFamily: fonts.regular, color: colors.textFaint, fontSize: 12, marginTop: 10 },

  statusPill: { borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 4 },
  statusText: { fontFamily: fonts.extrabold, fontSize: 12 },
  keyRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  keyInput: {
    flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.text, fontFamily: fonts.medium, fontSize: 15, borderWidth: 1.5, borderColor: colors.border,
  },
  keyToggle: { justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cardAlt },
  keyToggleText: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 13 },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  testBtn: { backgroundColor: colors.cardAlt, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.volt },
  testDisabled: { borderColor: colors.border, opacity: 0.5 },
  testBtnTxt: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.volt },
  testResult: { fontFamily: fonts.bold, fontSize: 13, flexShrink: 1 },
  link: { fontFamily: fonts.bold, color: colors.volt, fontSize: 13, marginTop: 14 },

  privacyCard: { marginTop: 26 },
  privacyPad: { padding: 18, paddingStart: 22 },
  privacyTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 15, marginBottom: 6 },
  privacyText: { fontFamily: fonts.regular, color: colors.textDim, fontSize: 13, lineHeight: 20 },
});
