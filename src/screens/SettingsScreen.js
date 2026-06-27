import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/notifications';
import { colors, fonts, radius } from '../theme';

export default function SettingsScreen() {
  const { settings, setRemindersEnabled } = useApp();
  const [busy, setBusy] = useState(false);

  const onToggle = async (value) => {
    setBusy(true);
    const ok = await setRemindersEnabled(value);
    setBusy(false);
    if (value && !ok) {
      Alert.alert('ההתראות חסומות', 'אפשר הרשאת התראות לאפליקציה הזו בהגדרות המכשיר כדי לקבל תזכורות ארוחה.');
    }
  };

  return (
    <Screen glow="volt">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.overline}>הגדרות · תזכורות</Text>
        <Text style={styles.title}>הגדרות</Text>

        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingEnd: 14 }}>
              <Text style={styles.rowLabel}>תזכורות ארוחה</Text>
              <Text style={styles.rowSub}>קבל התראה מקומית בזמני הארוחות כדי להזכיר לך לאכול ולרשום את המזון.</Text>
            </View>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={onToggle}
              disabled={busy}
              trackColor={{ true: colors.volt, false: colors.surface3 }}
              thumbColor={settings.remindersEnabled ? colors.ink : '#E8E0CE'}
              ios_backgroundColor={colors.surface3}
            />
          </View>
        </Card>

        <Text style={styles.section}>לוח התזכורות</Text>
        <Card padded={false}>
          {settings.reminderTimes.map((t, i) => (
            <View key={`${t.hour}-${t.minute}`} style={[styles.timeRow, i > 0 && styles.timeBorder]}>
              <View style={styles.timeLeft}>
                <View style={[styles.dot, { backgroundColor: settings.remindersEnabled ? colors.volt : colors.textFaint }]} />
                <Text style={styles.timeLabel}>{t.label}</Text>
              </View>
              <Text style={styles.timeValue}>{formatTime(t)}</Text>
            </View>
          ))}
        </Card>
        <Text style={styles.scheduleNote}>
          {settings.remindersEnabled ? 'התזכורות פעילות וחוזרות מדי יום.' : 'הפעל את תזכורות הארוחה למעלה כדי להפעיל את הלוח.'}
        </Text>

        <Card style={styles.privacyCard} accent={colors.volt} padded={false}>
          <View style={styles.privacyPad}>
            <Text style={styles.privacyTitle}>🔒 פרטיות מלאה</Text>
            <Text style={styles.privacyText}>
              כל הנתונים שלך — פרופיל, מזונות ויומן — נשמרים 100% מקומית במכשיר הזה. שום דבר לא נשלח לשרת כלשהו.
            </Text>
          </View>
        </Card>
      </ScrollView>
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
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  timeBorder: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  timeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 8 },
  timeLabel: { fontFamily: fonts.medium, color: colors.text, fontSize: 15 },
  timeValue: { fontFamily: fonts.extrabold, color: colors.volt, fontSize: 16, letterSpacing: 0.5 },
  scheduleNote: { fontFamily: fonts.regular, color: colors.textFaint, fontSize: 12, marginTop: 10 },

  privacyCard: { marginTop: 26 },
  privacyPad: { padding: 18, paddingStart: 22 },
  privacyTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 15, marginBottom: 6 },
  privacyText: { fontFamily: fonts.regular, color: colors.textDim, fontSize: 13, lineHeight: 20 },
});
