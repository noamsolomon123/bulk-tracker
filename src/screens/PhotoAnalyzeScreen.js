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
  EMPTY: 'לא זוהו פריטי מזון. נסה תמונה ברורה יותר.',
};

const REF_ORDER = ['none', 'card', 'coin10', 'coin5'];
const SLOT_LABELS = ['מלמעלה', 'זווית 45°'];

let uid = 0;

export default function PhotoAnalyzeScreen({ navigation }) {
  const { settings, addLogEntry } = useApp();
  const hasKey = !!(settings.geminiKey && settings.geminiKey.trim());
  const [reference, setReference] = useState('none');
  const [phase, setPhase] = useState('pick'); // pick | loading | result
  const [photos, setPhotos] = useState([]); // { uri, base64, mimeType }
  const [items, setItems] = useState([]);
  const [assumptions, setAssumptions] = useState('');

  const addPhoto = async (fromCamera) => {
    if (photos.length >= 2) {
      Alert.alert('מקסימום 2 תמונות', 'הסר תמונה כדי להוסיף אחרת.');
      return;
    }
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('הרשאה נדרשת', fromCamera ? 'אשר גישה למצלמה.' : 'אשר גישה לתמונות.');
      return;
    }
    const opts = { base64: true, quality: 0.4, mediaTypes: ['images'] };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets && res.assets[0]) {
      const a = res.assets[0];
      setPhotos((p) => [...p, { uri: a.uri, base64: a.base64, mimeType: a.mimeType || 'image/jpeg' }]);
    }
  };

  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const analyze = async () => {
    if (!settings.geminiKey || !settings.geminiKey.trim()) {
      Alert.alert('דרוש מפתח', 'הוסף מפתח Gemini במסך ההגדרות כדי לנתח תמונות.');
      return;
    }
    if (!photos.length) return;
    setPhase('loading');
    try {
      const r = await analyzePlatePhoto({
        images: photos.map((p) => ({ base64: p.base64, mimeType: p.mimeType })),
        apiKey: settings.geminiKey,
        reference,
      });
      setItems(
        r.items.map((it) => {
          // No usable gram baseline from the AI — record but don't scale, and
          // require the user to enter grams before it can be logged.
          const synthetic = !(it.grams > 0);
          return {
            id: `ph-${uid++}`,
            name: it.name,
            source: it.source,
            gramsStr: synthetic ? '' : String(it.grams),
            calories: it.calories,
            protein: it.protein,
            _g0: it.grams,
            _c0: it.calories,
            _p0: it.protein,
            _synthetic: synthetic,
          };
        })
      );
      setAssumptions(r.assumptions);
      setPhase('result');
    } catch (e) {
      setPhase('pick');
      Alert.alert('ניתוח תמונה', ERRORS[e.message] || 'שגיאה בניתוח. נסה שוב.');
    }
  };

  const setGrams = (id, text) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        // No reliable baseline to scale from: keep the typed grams, leave macros.
        if (it._synthetic || !(it._g0 > 0)) return { ...it, gramsStr: text };
        const g = parseFloat(text.replace(',', '.'));
        const ratio = !isNaN(g) && g >= 0 ? g / it._g0 : 0;
        return { ...it, gramsStr: text, calories: Math.round(it._c0 * ratio), protein: Math.round(it._p0 * ratio * 10) / 10 };
      })
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  // Only items with a positive gram amount can be logged (no 0‑gram junk).
  const addable = items.filter((it) => Math.round(parseFloat(it.gramsStr) || 0) > 0);
  const total = addable.reduce((a, it) => ({ cal: a.cal + it.calories, pro: a.pro + it.protein }), { cal: 0, pro: 0 });

  const addAll = () => {
    if (!addable.length) {
      Alert.alert('אין פריטים תקינים', 'הזן כמות גרמים גדולה מ‑0 לפחות לפריט אחד.');
      return;
    }
    addable.forEach((it) => {
      const grams = Math.round(parseFloat(it.gramsStr) || 0);
      addLogEntry({ id: it.id, name: it.name, servingLabel: `${grams} גרם`, calories: it.calories, protein: it.protein }, 1);
    });
    navigation.popToTop();
  };

  const reset = () => { setPhase('pick'); setItems([]); setPhotos([]); };

  return (
    <Screen edges={['bottom']} glow="amber">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {phase !== 'result' ? (
          <>
            {!hasKey ? (
              <Card accent={colors.amber} style={styles.keyBanner}>
                <Text style={styles.keyBannerTitle}>דרוש מפתח Gemini</Text>
                <Text style={styles.keyBannerText}>ניתוח צלחת עם AI מחייב מפתח Gemini חינמי. הגדר אותו פעם אחת כדי להתחיל.</Text>
                <Pressable
                  style={styles.keyBannerBtn}
                  onPress={() => navigation.getParent()?.navigate('Settings')}
                  accessibilityRole="button"
                  accessibilityLabel="פתח הגדרות"
                >
                  <Text style={styles.keyBannerBtnTxt}>פתח הגדרות ↗</Text>
                </Pressable>
              </Card>
            ) : null}

            <Text style={styles.lead}>
              לדיוק מרבי צלם <Text style={{ color: colors.volt, fontFamily: fonts.bold }}>שתי תמונות</Text> של אותה צלחת: אחת מלמעלה ואחת בזווית ~45° (כדי לראות גובה). תמונה אחת גם עובדת.
            </Text>

            <Text style={styles.label}>עוגן קנה-מידה (אופציונלי)</Text>
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
            <Text style={styles.tip}>
              {reference === 'none'
                ? 'ברירת מחדל: ה‑AI משתמש בצלחת/מזלג כסרגל. לדיוק נוסף אפשר להניח כרטיס אשראי (85.6×54 מ״מ) ולבחור בו.'
                : 'הנח את עצם הייחוס שטוח ליד הצלחת, באותו מישור.'}
            </Text>

            {photos.length ? (
              <View style={styles.thumbs}>
                {photos.map((p, i) => (
                  <View key={i} style={styles.thumbBox}>
                    <Image source={{ uri: p.uri }} style={styles.thumb} />
                    <Text style={styles.thumbLabel}>{SLOT_LABELS[i] || `תמונה ${i + 1}`}</Text>
                    <Pressable style={styles.thumbDel} onPress={() => removePhoto(i)} hitSlop={6} accessibilityRole="button" accessibilityLabel="הסר תמונה"><Text style={styles.thumbDelTxt}>✕</Text></Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {phase === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.volt} size="large" />
                <Text style={styles.loadingTxt}>מנתח את הצלחת…</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                {photos.length < 2 ? (
                  <View style={styles.pickRow}>
                    <Button label="צלם" icon="📷" onPress={() => addPhoto(true)} style={styles.pickBtn} />
                    <Button label="גלריה" icon="🖼️" tone="amber" onPress={() => addPhoto(false)} style={styles.pickBtn} />
                  </View>
                ) : null}
                {photos.length ? (
                  <Button label={`נתח ${photos.length} תמונות`} icon="✨" onPress={analyze} style={{ marginTop: 14 }} />
                ) : null}
              </View>
            )}
          </>
        ) : (
          <>
            {photos[0] ? <Image source={{ uri: photos[0].uri }} style={styles.preview} /> : null}
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
              <Card key={it.id} accent={it.source === 'db' ? colors.volt : colors.amber} padded={false} style={styles.item}>
                <View style={styles.itemPad}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                      <Text style={[styles.srcTag, { backgroundColor: it.source === 'db' ? colors.volt : colors.surface3, color: it.source === 'db' ? colors.ink : colors.textDim }]}>
                        {it.source === 'db' ? 'מאגר' : 'AI'}
                      </Text>
                    </View>
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
                  <Pressable onPress={() => removeItem(it.id)} hitSlop={8} style={styles.del} accessibilityRole="button" accessibilityLabel={`הסר ${it.name}`}><Text style={styles.delTxt}>✕</Text></Pressable>
                </View>
              </Card>
            ))}

            {assumptions ? <Text style={styles.assume}>📝 {assumptions}</Text> : null}

            <Button label={`הוסף ${addable.length} פריטים ליומן`} icon="＋" onPress={addAll} style={{ marginTop: 16 }} />
            <Pressable onPress={reset} style={styles.again}><Text style={styles.againTxt}>נתח צלחת אחרת</Text></Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  keyBanner: { padding: 16, paddingStart: 20, marginBottom: 20 },
  keyBannerTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginBottom: 4 },
  keyBannerText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textDim, lineHeight: 19 },
  keyBannerBtn: { alignSelf: 'flex-start', marginTop: 10, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.amber, paddingHorizontal: 14, paddingVertical: 8 },
  keyBannerBtnTxt: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.amber },
  lead: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 23, marginBottom: 22 },
  label: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 12, letterSpacing: 1, marginBottom: 10 },
  refRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  refChip: { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 9, borderWidth: 1.5, borderColor: colors.border },
  refOn: { backgroundColor: colors.volt, borderColor: colors.volt },
  refTxt: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 13 },
  refTxtOn: { color: colors.ink },
  tip: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginTop: 10, lineHeight: 18 },

  thumbs: { flexDirection: 'row', gap: 12, marginTop: 20 },
  thumbBox: { alignItems: 'center' },
  thumb: { width: 110, height: 110, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  thumbLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textDim, marginTop: 6 },
  thumbDel: { position: 'absolute', top: -6, insetInlineEnd: -6, backgroundColor: colors.ember, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  thumbDelTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 12 },

  actions: { marginTop: 24 },
  pickRow: { flexDirection: 'row', gap: 12 },
  pickBtn: { flex: 1 },
  loading: { alignItems: 'center', marginTop: 30 },
  loadingTxt: { fontFamily: fonts.bold, color: colors.textDim, fontSize: 15, marginTop: 14 },
  preview: { width: '100%', height: 180, borderRadius: radius.lg, marginBottom: 16, borderWidth: 1.5, borderColor: colors.border },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  totalLabel: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  totalVal: { fontFamily: fonts.display, fontSize: 18 },
  totalUnit: { fontFamily: fonts.medium, fontSize: 12, color: colors.textDim },
  editHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, marginBottom: 14 },

  item: { marginBottom: 10 },
  itemPad: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingStart: 18, gap: 10 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, flexShrink: 1 },
  srcTag: { fontFamily: fonts.extrabold, fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, overflow: 'hidden', includeFontPadding: false },
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
