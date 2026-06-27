import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

export default function AddFoodScreen({ navigation }) {
  const { allFoods, addLogEntry, deleteCustomFood } = useApp();
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="חיפוש מזון…"
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('CreateFood')}
        >
          <Text style={styles.newBtnText}>+ חדש</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: selected ? 140 : 24 }}
        renderItem={({ item }) => {
          const isSel = selected?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.food, isSel && styles.foodSelected]}
              onPress={() => setSelected(item)}
              onLongPress={() => item.custom && removeCustom(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>
                  {item.name}
                  {item.custom ? '  ·  שלי' : ''}
                </Text>
                <Text style={styles.foodSub}>{item.servingLabel}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.macro, { color: colors.calories }]}>{item.calories} קק״ל</Text>
                <Text style={[styles.macro, { color: colors.protein }]}>{item.protein} גרם חלבון</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>אין מזונות שתואמים ל“{query}”. הקש “+ חדש” כדי ליצור.</Text>
        }
      />

      {selected && (
        <View style={styles.addBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selName}>{selected.name}</Text>
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
          <TouchableOpacity style={styles.confirm} onPress={doAdd}>
            <Text style={styles.confirmText}>הוסף</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { flexDirection: 'row', padding: 16, paddingBottom: 4, gap: 10 },
  search: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newBtn: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  newBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  food: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  foodName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  foodSub: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  macro: { fontSize: 13, fontWeight: '700' },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 30, fontSize: 15 },
  addBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: colors.cardAlt,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  selSub: { color: colors.textDim, fontSize: 12 },
  qty: {
    width: 56,
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingVertical: 10,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  servings: { color: colors.textDim, fontSize: 13 },
  confirm: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
