import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { lookupFoodNutrition } from '../utils/gemini';
import { colors, fonts, radius } from '../theme';

const AI_ERRORS = {
  NO_KEY: 'לא הוגדר מפתח Gemini. הוסף אותו במסך ההגדרות כדי לחפש עם AI.',
  BAD_KEY: 'המפתח שגוי או נדחה. בדוק אותו במסך ההגדרות.',
  RATE_LIMIT: 'חרגת ממכסת הבקשות החינמית. נסה שוב בעוד דקה.',
  NETWORK: 'אין חיבור לאינטרנט.',
  EMPTY: 'לא הצלחתי למצוא ערכים. נסה ניסוח אחר.',
};

export default function AddFoodScreen({ navigation }) {
  const { allFoods, addLogEntry, addCustomFood, deleteCustomFood, settings, hydrated } = useApp();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('הכל');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState('1');
  const [aiBusy, setAiBusy] = useState(false);

  const cats = useMemo(() => {
    const seen = [];
    for (const f of allFoods) if (f.cat && !seen.includes(f.cat)) seen.push(f.cat);
    return ['הכל', ...seen];
  }, [allFoods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFoods.filter(
      (f) => (cat === 'הכל' || f.cat === cat) && (!q || f.name.toLowerCase().includes(q))
    );
  }, [allFoods, query, cat]);

  const runAiLookup = async () => {
    const q = query.trim();
    if (!q) return;
    setAiBusy(true);
    try {
      const r = await lookupFoodNutrition(q, settings.geminiKey);
      setSelected({ ...r, id: 'ai-' + Date.now(), __ai: true });
      setQty('1');
    } catch (e) {
      if (e.message === 'NO_KEY') {
        Alert.alert('חיפוש AI', AI_ERRORS.NO_KEY, [
          { text: 'ביטול', style: 'cancel' },
          { text: 'פתח הגדרות', onPress: () => navigation.getParent()?.navigate('Settings') },
        ]);
      } else {
        Alert.alert('חיפוש AI', AI_ERRORS[e.message] || 'שגיאת AI. נסה שוב.');
      }
    } finally {
      setAiBusy(false);
    }
  };

  const doAdd = () => {
    const n = parseFloat(qty.replace(',', '.'));
    if (!selected || !n || n <= 0) {
      Alert.alert('הזן כמות', 'אנא הזן כמה מנות אכלת.');
      return;
    }
    // AI results are saved into "my foods" so they are reusable next time.
    const food = selected.__ai ? addCustomFood(selected) : selected;
    addLogEntry(food, n);
    navigation.goBack();
  };

  const removeCustom = (food) => {
    Alert.alert('מחיקת מזון שלי', `למחוק את "${food.name}" מהמזונות שלך?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          deleteCustomFood(food.id);
          if (selected?.id === food.id) setSelected(null);
        },
      },
    ]);
  };

  return (
    <Screen edges={['bottom']} glow="volt">
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="חיפוש מזון…"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
        />
        <Pressable style={styles.scanBtn} onPress={() => navigation.navigate('ScanBarcode')} accessibilityRole="button" accessibilityLabel="סריקת ברקוד">
          <Text style={styles.scanBtnText}>📷</Text>
        </Pressable>
        <Pressable style={styles.newBtn} onPress={() => navigation.navigate('CreateFood')} accessibilityRole="button" accessibilityLabel="צור מזון חדש">
          <Text style={styles.newBtnText}>＋ חדש</Text>
        </Pressable>
      </View>

      <View style={styles.catBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContent} keyboardShouldPersistTaps="handled">
          {cats.map((c) => {
            const on = c === cat;
            return (
              <Pressable key={c} onPress={() => setCat(c)} style={[styles.catChip, on && styles.catChipOn]}>
                <Text style={[styles.catText, on && styles.catTextOn]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!hydrated ? (
        <View style={styles.loadingWrap}><ActivityIndicator color={colors.volt} /></View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: selected ? 150 : 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          query.trim() ? (
            <Pressable style={styles.aiRow} onPress={runAiLookup} disabled={aiBusy}>
              {aiBusy ? <ActivityIndicator color={colors.volt} /> : <Text style={styles.aiIcon}>🔮</Text>}
              <Text style={styles.aiText} numberOfLines={1}>
                {aiBusy ? 'מחפש עם AI…' : `חפש “${query.trim()}” עם AI`}
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const isSel = selected?.id === item.id;
          const rail = item.custom ? colors.volt : colors.amber;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              onLongPress={() => item.custom && removeCustom(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.calories} קלוריות, ${item.protein} גרם חלבון`}
              accessibilityHint={item.custom ? 'לחיצה ארוכה מוחקת מזון שלי' : undefined}
            >
              <Card accent={rail} padded={false} style={[styles.food, isSel && styles.foodSel]}>
                <View style={styles.foodPad}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.foodNameRow}>
                      <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                      {item.custom ? <Text style={styles.tag}>שלי</Text> : null}
                    </View>
                    <Text style={styles.foodSub}>{item.servingLabel}</Text>
                  </View>
                  <View style={styles.foodMacros}>
                    <Text style={[styles.macro, { color: colors.amber }]}>{item.calories} <Text style={styles.macroUnit}>קק״ל</Text></Text>
                    <Text style={[styles.macro, { color: colors.volt }]}>{item.protein} <Text style={styles.macroUnit}>חלבון</Text></Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query.trim() ? `אין מזונות שתואמים ל“${query.trim()}”.` : 'אין מזונות בקטגוריה זו.'}
            {'\n'}נסה חיפוש AI למעלה, או “＋ חדש”.
          </Text>
        }
      />
      )}

      {selected && (
        <View style={[styles.addBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.selNameRow}>
              {selected.__ai ? <Text style={styles.aiBadge}>✨ AI</Text> : null}
              <Text style={styles.selName} numberOfLines={1}>{selected.name}</Text>
            </View>
            <Text style={styles.selSub}>
              {selected.calories} קק״ל · {selected.protein} גרם · לכל {selected.servingLabel}
            </Text>
          </View>
          <TextInput style={styles.qty} keyboardType="numeric" value={qty} onChangeText={setQty} selectTextOnFocus />
          <Text style={styles.servings}>מנות</Text>
          <Button label="הוסף" onPress={doAdd} style={styles.confirm} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', padding: 18, paddingBottom: 8, gap: 10 },
  search: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 13,
    color: colors.text, fontFamily: fonts.medium, fontSize: 16, borderWidth: 1.5, borderColor: colors.border,
  },
  newBtn: {
    borderRadius: radius.md, paddingHorizontal: 16, justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.volt, backgroundColor: colors.voltGlow,
  },
  newBtnText: { fontFamily: fonts.extrabold, color: colors.volt, fontSize: 14 },
  scanBtn: {
    borderRadius: radius.md, paddingHorizontal: 14, justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cardAlt,
  },
  scanBtnText: { fontSize: 18 },

  catBar: { paddingBottom: 6 },
  catContent: { paddingHorizontal: 18, gap: 8 },
  catChip: {
    backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: colors.border,
  },
  catChipOn: { backgroundColor: colors.volt, borderColor: colors.volt },
  catText: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 13 },
  catTextOn: { color: colors.ink },

  aiRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, padding: 14,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.volt, backgroundColor: colors.voltGlow,
  },
  aiIcon: { fontSize: 18 },
  aiText: { fontFamily: fonts.bold, color: colors.volt, fontSize: 14, flexShrink: 1 },

  food: { marginBottom: 10 },
  foodSel: { borderColor: colors.volt, backgroundColor: colors.cardAlt },
  foodPad: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingStart: 18 },
  foodNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, flexShrink: 1 },
  tag: {
    fontFamily: fonts.extrabold, fontSize: 10, color: colors.ink, backgroundColor: colors.volt,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, overflow: 'hidden',
    includeFontPadding: false, textAlignVertical: 'center',
  },
  foodSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textDim, marginTop: 3 },
  foodMacros: { alignItems: 'flex-end', gap: 2 },
  macro: { fontFamily: fonts.extrabold, fontSize: 14 },
  macroUnit: { fontFamily: fonts.medium, fontSize: 10, color: colors.textDim },
  empty: { fontFamily: fonts.regular, color: colors.textDim, textAlign: 'center', marginTop: 36, fontSize: 15, lineHeight: 24 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },

  addBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
    backgroundColor: colors.bgElev, borderTopWidth: 1.5, borderTopColor: colors.border,
  },
  selNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBadge: {
    fontFamily: fonts.extrabold, fontSize: 10, color: colors.ink, backgroundColor: colors.volt,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.sm, overflow: 'hidden', includeFontPadding: false,
  },
  selName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, flexShrink: 1 },
  selSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textDim, marginTop: 2 },
  qty: {
    width: 58, backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: 11,
    textAlign: 'center', color: colors.text, fontFamily: fonts.extrabold, fontSize: 17,
    borderWidth: 1.5, borderColor: colors.border,
  },
  servings: { fontFamily: fonts.medium, color: colors.textDim, fontSize: 13 },
  confirm: { paddingHorizontal: 22, paddingVertical: 13 },
});
