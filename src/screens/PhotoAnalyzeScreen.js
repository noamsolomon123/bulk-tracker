import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';
import { analyzePlatePhoto, REFERENCES } from '../utils/geminiVision';
import { colors, fonts, radius } from '../theme';

const ERRORS = {
  NO_KEY: 'לא הוגדר מפתח Gemini. הוסף אותו במסך ההגדרות.',
  BAD_KEY: 'המפתח שגוי או נדחה. בדוק אותו בהגדרות.',
  RATE_LIMIT: 'חרגת ממכסת הבקשות. נסה שוב בעוד דקה.',
  NETWORK: 'אין חיבור לאינטרנט.',
  EMPTY: 'לא זוהו פריטי מזון בתמונה. נסה תמונה ברורה יותר.',
};

const REF_ORDER = ['card', 'coin10', 'coin5', 'none'];

let uid = 0;

export default function PhotoAnalyzeScreen({ navigation }) {
  const { settings, addLogEntry } = useApp();
  const [reference, setReference] = useState('card');
  const [phase, setPhase] = useState('pick'); // pick | loading | result
  const [imageUri, setImageUri] = useState(null);
  const [items, setItems] = useState([]);
  const [assumptions, setAssumptions] = useState('');

  const analyze = async (asset) => {
    if (!settings.geminiKey || !settings.geminiKey.trim()) {
      Alert.alert('דרוש מפתח', 'הוסף מפתח Gemini במסך ההגדרות כדי לנתח תמונות.');
      return;
    }
    setImageUri(asset.uri);
    setPhase('loading');
    try {
      const r = await analyzePlatePhoto({
        base64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
        apiKey: settings.geminiKey,
        reference,
      });
      setItems(
        r.items.map((it) => ({
          id: `ph-${uid++}`,
          name: it.name,
          gramsStr: String(it.grams),
          calories: it.calories,
          protein: it.protein,
          _g0: it.grams || 1,
          _c0: it.calories,
          _p0: it.protein,
        }))
      );
      setAssumptions(r.assumptions);
      setPhase('result');
    } catch (e) {
      setPhase('pick');
      Alert.alert('ניתוח תמונה', ERRORS[e.message] || 'שגיאה בניתוח. נסה שוב.');
    }
  };

  const capture = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('הרשאה נדרשת', fromCamera ? 'אשר גישה למצלמה.' : 'אשר גישה לתמונות.');
      return;
    }
    const opts = { base64: true, quality: 0.4, mediaTypes: ['images'] };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets && res.assets[0]) analyze(res.assets[0]);
  };

  const setGrams = (id, text) => {
    const g = parseFloat(text.replace(',', '.'));
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const ratio = !isNaN(g) && it._g0 > 0 ? g / it._g0 : 0;
        return { ...it, gramsStr: text, calories: Math.round(it._c0 * ratio), protein: Math.round(it._p0 * ratio * 10) / 10 };
      })
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const total = items.reduce((a, it) => ({ cal: a.cal + it.calories, pro: a.pro + it.protein }), { cal: 0, pro: 0 });

  const addAll = () => {
    items.forEach((it) => {
      const grams = Math.round(parseFloat(it.gramsStr) || 0);
      addLogEntry({ id: it.id, name: it.name, servingLabel: `${grams} גרם`, calories: it.calories, protein: it.protein }, 1);
    });
    navigation.popToTop();
  };

  return (
    <Screen edges={['bottom']} glow="amber">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {phase !== 'result' ? (
          <>
            <Text style={styles.lead}>
              צלם את הצלחת והנח לידה <Text style={{ color: colors.volt, fontFamily: fonts.bold }}>עצם בגודל ידוע</Text> כסרגל — כך ה‑AI מעריך מנות מדויק יותר.
            </Text>

            <Text style={styles.label}>עצם הייחוס בתמונה</Text>
            <View style={styles.refRow}>
              {REF_ORDER.map((k) => {
                const on = reference === k;
                return (
                  <Pressable key={k} onPress={() => setReference(k)} style={[styles.refChip, on && styles.refOn]}>
                    <Text style={[styles.refTxt, on && styles.refTxtOn]}>{REFERENCES[k].label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {reference === 'card' ? (
              <Text style={styles.tip}>טיפ: כרטיס אשראי/תעודה הוא 85.6×54 מ״מ — מדויק ותמיד איתך. הנח אותו שטוח ליד הצלחת.</Text>
            ) : null}

            {imageUri && phase === 'loading' ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

            {phase === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.volt} size="large" />
                <Text style={styles.loadingTxt}>מנתח את הצלחת…</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <Button label="צלם תמונה" icon="📷" onPress={() => capture(true)} style={{ marginBottom: 12 }} />
                <Button label="בחר מהגלריה" icon="🖼️" tone="amber" onPress={() => capture(false)} />
              </View>
            )}
          </>
        ) : (
          <>
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>סה״כ מהצלחת</Text>
              <Text style={styles.totalVal}>
                <Text style={{ color: colors.amber }}>{total.cal}</Text>
                <Text style={styles.totalUnit}> קק״ל · </Text>
                <Text style={{ color: colors.volt }}>{Math.round(total.pro)}</Text>
                <Text style={styles.totalUnit}> גרם חלבון</Text>
              </Text>
            </View>
            <Text style={styles.editHint}>בדוק ותקן גרמים לפי הצורך — הקלוריות מתעדכנות אוטומטית.</Text>

            {items.map((it) => (
              <Card key={it.id} accent={colors.amber} padded={false} style={styles.item}>
                <View style={styles.itemPad}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                    <Text style={styles.itemMacro}>
                      <Text style={{ color: colors.amber, fontFamily: fonts.extrabold }}>{it.calories}</Text>
                      <Text style={styles.itemUnit}> קק״ל · </Text>
                      <Text style={{ color: colors.volt, fontFamily: fonts.extrabold }}>{it.protein}</Text>
                      <Text style={styles.itemUnit}> גרם חלבון</Text>
                    </Text>
                  </View>
                  <View style={styles.gramsWrap}>
                    <TextInput style={styles.grams} keyboardType="numeric" value={it.gramsStr} onChangeText={(t) => setGrams(it.id, t)} selectTextOnFocus />
                    <Text style={styles.gramsUnit}>גרם</Text>
                  </View>
                  <Pressable onPress={() => removeItem(it.id)} hitSlop={8} style={styles.del}><Text style={styles.delTxt}>✕</Text></Pressable>
                </View>
              </Card>
            ))}

            {assumptions ? <Text style={styles.assume}>📝 {assumptions}</Text> : null}

            <Button label={`הוסף ${items.length} פריטים ליומן`} icon="＋" onPress={addAll} style={{ marginTop: 16 }} />
            <Pressable onPress={() => { setPhase('pick'); setItems([]); setImageUri(null); }} style={styles.again}>
              <Text style={styles.againTxt}>נתח תמונה אחרת</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  lead: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 23, marginBottom: 22 },
  label: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 12, letterSpacing: 1, marginBottom: 10 },
  refRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  refChip: { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 9, borderWidth: 1.5, borderColor: colors.border },
  refOn: { backgroundColor: colors.volt, borderColor: colors.volt },
  refTxt: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 13 },
  refTxtOn: { color: colors.ink },
  tip: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: 10, lineHeight: 18 },

  actions: { marginTop: 28 },
  loading: { alignItems: 'center', marginTop: 30 },
  loadingTxt: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 15, marginTop: 14 },
  preview: { width: '100%', height: 200, borderRadius: radius.lg, marginBottom: 16, borderWidth: 1.5, borderColor: colors.border },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  totalLabel: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  totalVal: { fontFamily: fonts.display, fontSize: 18 },
  totalUnit: { fontFamily: fonts.medium, fontSize: 12, color: colors.textDim },
  editHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginBottom: 14 },

  item: { marginBottom: 10 },
  itemPad: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingStart: 18, gap: 10 },
  itemName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  itemMacro: { marginTop: 3, fontSize: 13 },
  itemUnit: { fontFamily: fonts.medium, fontSize: 11, color: colors.textDim },
  gramsWrap: { alignItems: 'center' },
  grams: {
    width: 58, backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: 8, textAlign: 'center',
    color: colors.text, fontFamily: fonts.extrabold, fontSize: 16, borderWidth: 1.5, borderColor: colors.border,
  },
  gramsUnit: { fontFamily: fonts.medium, fontSize: 10, color: colors.textFaint, marginTop: 2 },
  del: { padding: 2 },
  delTxt: { fontFamily: fonts.bold, fontSize: 15, color: colors.ember },
  assume: { fontFamily: fonts.regular, fontSize: 12, color: colors.textDim, lineHeight: 18, marginTop: 8, fontStyle: 'italic' },
  again: { alignSelf: 'center', marginTop: 14, padding: 8 },
  againTxt: { fontFamily: fonts.bold, color: colors.volt, fontSize: 14 },
});
