import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius } from '../theme';

export default function AddFoodScreen({ navigation }) {
  const { allFoods, addLogEntry, deleteCustomFood } = useApp();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState('1');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allFoods;
    return allFoods.filter((f) => f.name.toLowerCase().includes(q));
  }, [allFoods, query]);

  const doAdd = () => {
    const n = parseFloat(qty.replace(',', '.'));
    if (!selected || !n || n <= 0) {
      Alert.alert('הזן כמות', 'אנא הזן כמה מנות אכלת.');
      return;
    }
    addLogEntry(selected, n);
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
        <Pressable style={styles.newBtn} onPress={() => navigation.navigate('CreateFood')}>
          <Text style={styles.newBtnText}>＋ חדש</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: selected ? 150 : 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSel = selected?.id === item.id;
          const rail = item.custom ? colors.volt : colors.amber;
          return (
            <Pressable onPress={() => setSelected(item)} onLongPress={() => item.custom && removeCustom(item)}>
              <Card
                accent={rail}
                padded={false}
                style={[styles.food, isSel && styles.foodSel]}
              >
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
          <Text style={styles.empty}>אין מזונות שתואמים ל“{query}”.{'\n'}הקש “＋ חדש” כדי ליצור מזון.</Text>
        }
      />

      {selected && (
        <View style={[styles.addBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selName} numberOfLines={1}>{selected.name}</Text>
            <Text style={styles.selSub}>לכל {selected.servingLabel}</Text>
          </View>
          <TextInput
            style={styles.qty}
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
            selectTextOnFocus
          />
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
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  newBtn: {
    borderRadius: radius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.volt,
    backgroundColor: colors.voltGlow,
  },
  newBtnText: { fontFamily: fonts.extrabold, color: colors.volt, fontSize: 14 },

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

  addBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16,
    backgroundColor: colors.bgElev,
    borderTopWidth: 1.5, borderTopColor: colors.border,
  },
  selName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  selSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textDim, marginTop: 1 },
  qty: {
    width: 58, backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: 11,
    textAlign: 'center', color: colors.text, fontFamily: fonts.extrabold, fontSize: 17,
    borderWidth: 1.5, borderColor: colors.border,
  },
  servings: { fontFamily: fonts.medium, color: colors.textDim, fontSize: 13 },
  confirm: { paddingHorizontal: 22, paddingVertical: 13 },
});
