import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/notifications';
import { colors } from '../theme';

export default function SettingsScreen() {
  const { settings, setRemindersEnabled } = useApp();
  const [busy, setBusy] = useState(false);

  const onToggle = async (value) => {
    setBusy(true);
    const ok = await setRemindersEnabled(value);
    setBusy(false);
    if (value && !ok) {
      Alert.alert(
        'ההתראות חסומות',
        'אפשר הרשאת התראות לאפליקציה הזו בהגדרות המכשיר כדי לקבל תזכורות ארוחה.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>הגדרות</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>תזכורות ארוחה</Text>
              <Text style={styles.rowSub}>
                קבל התראה מקומית בזמני הארוחות כדי להזכיר לך לאכול ולרשום את המזון.
              </Text>
            </View>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={onToggle}
              disabled={busy}
              trackColor={{ true: colors.primary, false: colors.cardAlt }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.section}>לוח התזכורות</Text>
        <View style={styles.card}>
          {settings.reminderTimes.map((t, i) => (
            <View
              key={`${t.hour}-${t.minute}`}
              style={[styles.timeRow, i > 0 && styles.timeBorder]}
            >
              <Text style={styles.timeLabel}>{t.label}</Text>
              <Text style={styles.timeValue}>{formatTime(t)}</Text>
            </View>
          ))}
          <Text style={styles.scheduleNote}>
            {settings.remindersEnabled
              ? 'התזכורות פעילות וחוזרות מדי יום.'
              : 'הפעל את תזכורות הארוחה למעלה כדי להפעיל את הלוח.'}
          </Text>
        </View>

        <Text style={styles.privacy}>
          🔒 כל הנתונים שלך — פרופיל, מזונות ויומן — נשמרים 100% מקומית במכשיר הזה. שום דבר לא נשלח
          לשרת כלשהו.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 18 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
  rowSub: { color: colors.textDim, fontSize: 13, marginTop: 4, lineHeight: 18 },
  section: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  timeBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  timeLabel: { color: colors.text, fontSize: 15 },
  timeValue: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  scheduleNote: { color: colors.textDim, fontSize: 12, marginTop: 10 },
  privacy: { color: colors.textDim, fontSize: 13, marginTop: 26, lineHeight: 19, textAlign: 'center' },
});
