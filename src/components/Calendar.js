import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, radius } from '../theme';

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function Calendar({ year, month, byDay, goalCal = 0, todayKey, onSelect, onPrev, onNext, canNext = true }) {
  const first = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={onPrev} hitSlop={10} style={styles.nav} accessibilityRole="button" accessibilityLabel="חודש קודם"><Text style={styles.navTxt}>›</Text></Pressable>
        <Text style={styles.title}>{MONTHS[month]} {year}</Text>
        <Pressable onPress={onNext} hitSlop={10} style={styles.nav} disabled={!canNext} accessibilityRole="button" accessibilityLabel="חודש הבא"><Text style={[styles.navTxt, !canNext && styles.navDisabled]}>‹</Text></Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (d == null) return <View key={i} style={styles.cell} />;
          const k = keyOf(year, month, d);
          const day = byDay[k];
          const logged = !!day;
          const hit = logged && goalCal > 0 && day.calories >= goalCal;
          const isToday = k === todayKey;
          return (
            <Pressable key={i} style={styles.cell} onPress={() => logged && onSelect(k)} disabled={!logged}>
              <View style={[styles.dayBox, logged && styles.dayLogged, hit && styles.dayHit, isToday && styles.dayToday]}>
                <Text style={[styles.dayNum, logged && styles.dayNumLogged, hit && styles.dayNumHit]}>{d}</Text>
                {logged ? <View style={[styles.dot, { backgroundColor: hit ? colors.ink : colors.volt }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  nav: { paddingHorizontal: 10 },
  navTxt: { fontFamily: fonts.display, fontSize: 26, color: colors.volt },
  navDisabled: { opacity: 0.3 },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 12, color: colors.textFaint },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  dayBox: {
    flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent',
  },
  dayLogged: { backgroundColor: colors.cardAlt },
  dayHit: { backgroundColor: colors.volt },
  dayToday: { borderColor: colors.volt },
  dayNum: { fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint },
  dayNumLogged: { color: colors.text, fontFamily: fonts.bold },
  dayNumHit: { color: colors.ink },
  dot: { width: 4, height: 4, borderRadius: 4, marginTop: 2 },
});
