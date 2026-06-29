import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import BarChart from '../components/BarChart';
import Calendar from '../components/Calendar';
import { useApp, todayKey } from '../context/AppContext';
import { colors, fonts, radius } from '../theme';

const fmt = (n) => Math.round(n).toLocaleString('he-IL');
const niceDate = (key) => {
  if (!key) return '—';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
};

function Stat({ label, value, unit, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}{unit ? ` · ${unit}` : ''}</Text>
    </View>
  );
}

export default function StatsScreen({ navigation }) {
  const { stats, goals, getRecentDays, hydrated } = useApp();
  const [metric, setMetric] = useState('calories'); // calories | protein
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const chartW = Dimensions.get('window').width - 72;
  const recent = getRecentDays(14);
  const isCal = metric === 'calories';
  const chartData = recent.map((d) => ({
    value: isCal ? d.calories : d.protein,
    label: String(d.date.getDate()),
  }));
  const goal = isCal ? goals.calories : goals.protein;

  // Don't let the user page into empty future months that can never hold data.
  const atCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => {
    if (atCurrentMonth) return;
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  };

  const empty = stats.daysTracked === 0;

  return (
    <Screen glow="amber">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.overline}>הנתונים שלך · מאז שהתחלת</Text>
        <Text style={styles.title}>סטטיסטיקה</Text>

        {!hydrated ? (
          <Card style={[{ marginTop: 8 }, styles.loadingCard]}>
            <ActivityIndicator color={colors.volt} />
          </Card>
        ) : empty ? (
          <Card style={{ marginTop: 8 }}>
            <Text style={styles.emptyTitle}>עדיין אין נתונים 📊</Text>
            <Text style={styles.emptyText}>התחל לרשום ארוחות במסך הבית, והגרפים והיומן יתמלאו כאן.</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.hero} accent={colors.amber} padded={false}>
              <View style={styles.heroPad}>
                <Text style={styles.heroLabel}>סך הקלוריות שאכלת</Text>
                <Text style={styles.heroNum}>{fmt(stats.totalCalories)}</Text>
                <Text style={styles.heroSub}>
                  ב‑{stats.daysTracked} ימים · מאז {niceDate(stats.startDate)}
                </Text>
              </View>
            </Card>

            <View style={styles.statGrid}>
              <Stat label="ממוצע ליום" unit="קק״ל" value={fmt(stats.avgCalories)} color={colors.amber} />
              <Stat label="חלבון ביום" unit="גרם" value={fmt(stats.avgProtein)} color={colors.volt} />
              <Stat label="ימים ביעד" value={fmt(stats.daysOnTarget)} color={colors.volt} />
              <Stat label="רצף נוכחי" unit="ימים" value={fmt(stats.streak)} color={colors.amber} />
              <Stat label="שיא חלבון" unit="גרם" value={fmt(stats.bestProtein)} color={colors.volt} />
              <Stat label="סך חלבון" unit="גרם" value={fmt(stats.totalProtein)} color={colors.volt} />
            </View>

            <View style={styles.chartHead}>
              <Text style={styles.section}>14 הימים האחרונים</Text>
              <View style={styles.seg}>
                <Pressable onPress={() => setMetric('calories')} style={[styles.segBtn, isCal && styles.segOn]}>
                  <Text style={[styles.segTxt, isCal && styles.segTxtOn]}>קלוריות</Text>
                </Pressable>
                <Pressable onPress={() => setMetric('protein')} style={[styles.segBtn, !isCal && styles.segOn]}>
                  <Text style={[styles.segTxt, !isCal && styles.segTxtOn]}>חלבון</Text>
                </Pressable>
              </View>
            </View>
            <Card>
              <BarChart data={chartData} goal={goal} color={isCal ? colors.amber : colors.volt} width={chartW} />
            </Card>

            <Text style={[styles.section, { marginTop: 26 }]}>יומן</Text>
            <Card>
              <Calendar
                year={view.y}
                month={view.m}
                byDay={stats.byDay}
                goalCal={goals.calories}
                todayKey={todayKey()}
                onPrev={prevMonth}
                onNext={nextMonth}
                canNext={!atCurrentMonth}
                onSelect={(k) => navigation.navigate('DayDetail', { dateKey: k })}
              />
              <Text style={styles.calHint}>הקש על יום מסומן כדי לראות מה אכלת בו</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 44 },
  overline: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, color: colors.amber, marginBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginBottom: 16 },

  hero: { marginBottom: 12 },
  heroPad: { padding: 20, paddingStart: 22 },
  heroLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, color: colors.textDim, marginBottom: 6 },
  heroNum: { fontFamily: fonts.display, fontSize: 46, color: colors.amber, lineHeight: 50 },
  heroSub: { fontFamily: fonts.medium, fontSize: 13, color: colors.textDim, marginTop: 4 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 6 },
  statBox: {
    width: '32%', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center',
  },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textDim, marginTop: 3, textAlign: 'center' },

  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  section: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  seg: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, padding: 3 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  segOn: { backgroundColor: colors.volt },
  segTxt: { fontFamily: fonts.bold, fontSize: 12, color: colors.textDim },
  segTxtOn: { color: colors.ink },
  calHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 12 },

  loadingCard: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text, marginBottom: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textDim, lineHeight: 21 },
});
