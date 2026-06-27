import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ProgressBar';
import { colors } from '../theme';

function prettyDate(d = new Date()) {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function HomeScreen({ navigation }) {
  const { goals, getDay, deleteLogEntry, hydrated } = useApp();
  const day = getDay();

  const confirmDelete = (entry) => {
    Alert.alert('Remove entry', `Remove ${entry.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteLogEntry(entry.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={day.entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.date}>{prettyDate()}</Text>
            <Text style={styles.title}>Today's Progress</Text>

            <View style={styles.card}>
              <ProgressBar
                label="Calories"
                value={day.calories}
                goal={goals.calories}
                unit="kcal"
                color={colors.calories}
              />
              <ProgressBar
                label="Protein"
                value={day.protein}
                goal={goals.protein}
                unit="g"
                color={colors.protein}
              />
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddFood')}>
              <Text style={styles.addBtnText}>+ Add Food</Text>
            </TouchableOpacity>

            <Text style={styles.section}>Logged today ({day.entries.length})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.entry} onLongPress={() => confirmDelete(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryName}>{item.name}</Text>
              <Text style={styles.entrySub}>
                {item.quantity} × {item.servingLabel}
              </Text>
            </View>
            <View style={styles.entryMacros}>
              <Text style={[styles.macro, { color: colors.calories }]}>{item.calories} kcal</Text>
              <Text style={[styles.macro, { color: colors.protein }]}>{item.protein} g</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          hydrated ? (
            <Text style={styles.empty}>No food logged yet today. Tap “Add Food” to start.</Text>
          ) : null
        }
        ListFooterComponent={
          day.entries.length > 0 ? (
            <Text style={styles.hint}>Tip: long-press an entry to remove it.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  date: { color: colors.textDim, fontSize: 14, marginBottom: 2 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 14 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  addBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 6 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  entrySub: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  entryMacros: { alignItems: 'flex-end' },
  macro: { fontSize: 14, fontWeight: '700' },
  empty: { color: colors.textDim, fontSize: 15, textAlign: 'center', marginTop: 20, lineHeight: 22 },
  hint: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 16 },
});
