import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import StatRing from '../components/StatRing';
import FuelBar from '../components/FuelBar';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius } from '../theme';

function prettyDate(d = new Date()) {
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen({ navigation }) {
  const { goals, getDay, deleteLogEntry, hydrated } = useApp();
  const day = getDay();

  const calRemaining = goals.calories - day.calories;
  const calOver = calRemaining < 0;
  const calProgress = goals.calories > 0 ? day.calories / goals.calories : 0;

  const confirmDelete = (entry) => {
    Alert.alert('הסרת פריט', `להסיר ${entry.name}?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => deleteLogEntry(entry.id) },
    ]);
  };

  return (
    <Screen glow="amber">
      <FlatList
        data={day.entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.overline}>עלייה במסה · היעד היומי</Text>
            <Text style={styles.date}>{prettyDate()}</Text>

            <Card style={styles.hero} padded={false}>
              <View style={styles.heroInner}>
                <Text style={styles.ringCap}>קלוריות</Text>
                <StatRing size={232} stroke={20} progress={calProgress} over={calOver} color={colors.amber}>
                  <Text style={[styles.bigNum, { color: calOver ? colors.ember : colors.amber }]}>
                    {Math.abs(Math.round(calRemaining))}
                  </Text>
                  <Text style={styles.bigLabel}>{calOver ? 'קק״ל מעל היעד' : 'קק״ל נותרו'}</Text>
                  <View style={styles.ringFoot}>
                    <Text style={styles.ringFootNum}>{Math.round(day.calories)}</Text>
                    <Text style={styles.ringFootDim}> / {goals.calories} קק״ל</Text>
                  </View>
                </StatRing>
              </View>

              <View style={styles.divider} />

              <View style={styles.proteinWrap}>
                <FuelBar
                  label="חלבון"
                  icon="💪"
                  value={day.protein}
                  goal={goals.protein}
                  unit="גרם"
                  color={colors.volt}
                />
              </View>
            </Card>

            <Button label="הוספת מזון" icon="＋" onPress={() => navigation.navigate('AddFood')} style={styles.cta} />

            <View style={styles.sectionRow}>
              <Text style={styles.section}>נרשם היום</Text>
              <Text style={styles.count}>{day.entries.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onLongPress={() => confirmDelete(item)}>
            <Card style={styles.entry} accent={colors.amber} padded={false}>
              <View style={styles.entryPad}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.entrySub}>{item.quantity} × {item.servingLabel}</Text>
                </View>
                <View style={styles.entryMacros}>
                  <Text style={[styles.macro, { color: colors.amber }]}>{item.calories} <Text style={styles.macroUnit}>קק״ל</Text></Text>
                  <Text style={[styles.macro, { color: colors.volt }]}>{item.protein} <Text style={styles.macroUnit}>גרם</Text></Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          hydrated ? (
            <Text style={styles.empty}>עדיין לא רשמת מזון היום.{'\n'}הקש “הוספת מזון” כדי להתחיל לדלק.</Text>
          ) : null
        }
        ListFooterComponent={
          day.entries.length > 0 ? <Text style={styles.hint}>לחיצה ארוכה על פריט מסירה אותו</Text> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 36 },
  overline: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, color: colors.amber, marginBottom: 4 },
  date: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginBottom: 18 },

  hero: { alignItems: 'stretch' },
  heroInner: { alignItems: 'center', paddingTop: 22, paddingBottom: 18 },
  ringCap: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 3, color: colors.textDim, marginBottom: 14 },
  bigNum: { fontFamily: fonts.display, fontSize: 60, lineHeight: 64 },
  bigLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textDim, marginTop: 2 },
  ringFoot: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  ringFootNum: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  ringFootDim: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },

  divider: { height: 1.5, backgroundColor: colors.borderSoft, marginHorizontal: 18 },
  proteinWrap: { padding: 18 },

  cta: { marginTop: 16 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 26, marginBottom: 8 },
  section: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  count: {
    fontFamily: fonts.extrabold, fontSize: 13, color: colors.ink, backgroundColor: colors.volt,
    minWidth: 24, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false,
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden',
  },

  entry: { marginTop: 10 },
  entryPad: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingStart: 18 },
  entryName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  entrySub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textDim, marginTop: 2 },
  entryMacros: { alignItems: 'flex-end', gap: 2 },
  macro: { fontFamily: fonts.extrabold, fontSize: 15 },
  macroUnit: { fontFamily: fonts.medium, fontSize: 11, color: colors.textDim },

  empty: { fontFamily: fonts.regular, color: colors.textDim, fontSize: 15, textAlign: 'center', marginTop: 26, lineHeight: 24 },
  hint: { fontFamily: fonts.regular, color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 16 },
});
