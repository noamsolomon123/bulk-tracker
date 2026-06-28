import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import FuelBar from '../components/FuelBar';
import { useApp } from '../context/AppContext';
import { colors, fonts } from '../theme';

export default function DayDetailScreen({ route }) {
  const { dateKey } = route.params;
  const { getDay, goals, deleteLogEntry } = useApp();
  const day = getDay(dateKey);

  const confirmDelete = (entry) => {
    Alert.alert('הסרת פריט', `להסיר ${entry.name}?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => deleteLogEntry(entry.id) },
    ]);
  };

  return (
    <Screen edges={['bottom']} glow="amber">
      <FlatList
        data={day.entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Card style={{ marginBottom: 18 }}>
            <FuelBar label="קלוריות" icon="🔥" value={day.calories} goal={goals.calories} unit="קק״ל" color={colors.amber} />
            <View style={{ height: 16 }} />
            <FuelBar label="חלבון" icon="💪" value={day.protein} goal={goals.protein} unit="גרם" color={colors.volt} />
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable onLongPress={() => confirmDelete(item)}>
            <Card accent={colors.amber} padded={false} style={styles.entry}>
              <View style={styles.entryPad}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.entrySub}>{item.quantity} × {item.servingLabel}</Text>
                </View>
                <View style={styles.macros}>
                  <Text style={[styles.macro, { color: colors.amber }]}>{item.calories} <Text style={styles.unit}>קק״ל</Text></Text>
                  <Text style={[styles.macro, { color: colors.volt }]}>{item.protein} <Text style={styles.unit}>גרם</Text></Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>לא נרשם מזון ביום הזה.</Text>}
        ListFooterComponent={day.entries.length > 0 ? <Text style={styles.hint}>לחיצה ארוכה על פריט מסירה אותו</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 36 },
  entry: { marginBottom: 10 },
  entryPad: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingStart: 18 },
  entryName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  entrySub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textDim, marginTop: 2 },
  macros: { alignItems: 'flex-end', gap: 2 },
  macro: { fontFamily: fonts.extrabold, fontSize: 15 },
  unit: { fontFamily: fonts.medium, fontSize: 11, color: colors.textDim },
  empty: { fontFamily: fonts.regular, color: colors.textDim, textAlign: 'center', marginTop: 30, fontSize: 15 },
  hint: { fontFamily: fonts.regular, color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 16 },
});
