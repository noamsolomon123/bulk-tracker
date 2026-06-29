import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { lookupAnyBarcode } from '../utils/barcodeLookup';
import { colors, fonts, radius } from '../theme';

const ERRORS = {
  NOT_FOUND: 'הברקוד לא נמצא במאגר המקומי ולא ב‑Open Food Facts.',
  NETWORK: 'אין חיבור לאינטרנט — נמצא רק במאגר המקומי האופליין.',
  NO_NUTRITION: 'נמצא מוצר אך ללא ערכים תזונתיים.',
};

export default function ScanBarcodeScreen({ navigation }) {
  const { addCustomFood, addLogEntry } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('scan'); // scan | loading | result | notfound
  const [result, setResult] = useState(null);
  const [qty, setQty] = useState('1');
  const lock = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  const onScan = async ({ data }) => {
    if (lock.current) return;
    lock.current = true;
    setPhase('loading');
    try {
      const r = await lookupAnyBarcode(data);
      setResult({ ...r, code: data });
      setQty('1');
      setPhase('result');
    } catch (e) {
      setResult({ code: data, error: e.message });
      setPhase('notfound');
    }
  };

  const rescan = () => {
    lock.current = false;
    setResult(null);
    setPhase('scan');
  };

  const addToLog = () => {
    const n = parseFloat(String(qty).replace(',', '.')) || 1;
    const food = addCustomFood({
      name: result.name,
      servingLabel: result.servingLabel,
      calories: result.calories,
      protein: result.protein,
    });
    addLogEntry(food, n);
    navigation.popToTop();
  };

  // ---- permission states ----
  if (!permission) {
    return <View style={styles.fill} />;
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Text style={styles.bigEmoji}>📷</Text>
        <Text style={styles.title}>דרושה הרשאת מצלמה</Text>
        <Text style={styles.dim}>כדי לסרוק ברקודים, אשר גישה למצלמה.</Text>
        {permission.canAskAgain ? (
          <Button label="אפשר מצלמה" onPress={requestPermission} style={{ marginTop: 18, alignSelf: 'stretch' }} />
        ) : (
          <Button label="פתח הגדרות" onPress={() => Linking.openSettings()} style={{ marginTop: 18, alignSelf: 'stretch' }} />
        )}
      </SafeAreaView>
    );
  }

  // ---- result / not-found cards ----
  if (phase === 'result' || phase === 'notfound') {
    const found = phase === 'result';
    return (
      <SafeAreaView style={styles.resultWrap} edges={['bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 18 }}>
          {found ? (
            <Card accent={result.source === 'local' ? colors.volt : colors.amber} padded={false}>
              <View style={styles.resultPad}>
                <View style={styles.srcRow}>
                  <Text style={styles.srcBadge}>{result.source === 'local' ? 'מאגר ישראלי' : 'Open Food Facts'}</Text>
                  <Text style={styles.code}>{result.code}</Text>
                </View>
                <Text style={styles.foundName}>{result.name}</Text>
                <View style={styles.macrosRow}>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroNum, { color: colors.amber }]}>{result.calories}</Text>
                    <Text style={styles.macroLbl}>קק״ל / {result.servingLabel}</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroNum, { color: colors.volt }]}>{result.protein}</Text>
                    <Text style={styles.macroLbl}>גרם חלבון</Text>
                  </View>
                </View>
                <View style={styles.qtyRow}>
                  <Text style={styles.qtyLabel}>כמות (מנות):</Text>
                  <TextInput style={styles.qty} keyboardType="numeric" value={qty} onChangeText={setQty} selectTextOnFocus />
                </View>
                <Button label="הוסף ליומן" icon="＋" onPress={addToLog} style={{ marginTop: 16 }} />
                <Pressable onPress={rescan} style={styles.linkBtn}><Text style={styles.link}>סרוק שוב</Text></Pressable>
              </View>
            </Card>
          ) : (
            <Card padded>
              <Text style={styles.bigEmoji}>🔍</Text>
              <Text style={styles.title}>{ERRORS[result.error] || 'שגיאה בחיפוש.'}</Text>
              <Text style={styles.code}>קוד: {result.code}</Text>
              <Button label="הוסף ידנית" icon="✎" tone="amber" onPress={() => navigation.replace('CreateFood', { code: result.code })} style={{ marginTop: 18 }} />
              <Pressable onPress={rescan} style={styles.linkBtn}><Text style={styles.link}>סרוק שוב</Text></Pressable>
            </Card>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ---- camera (scan / loading) ----
  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={phase === 'scan' ? onScan : undefined}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>
          {phase === 'loading' ? 'מחפש מוצר…' : 'כוון את הברקוד אל תוך המסגרת'}
        </Text>
        {phase === 'loading' ? <ActivityIndicator color={colors.volt} size="large" style={{ marginTop: 14 }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  resultWrap: { flex: 1, backgroundColor: colors.bg },
  bigEmoji: { fontSize: 44, marginBottom: 14, textAlign: 'center' },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.text, textAlign: 'center', marginBottom: 8 },
  dim: { fontFamily: fonts.regular, fontSize: 14, color: colors.textDim, textAlign: 'center' },

  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: '74%', height: 150, borderRadius: radius.lg, borderWidth: 3, borderColor: colors.volt,
    backgroundColor: 'rgba(205,245,61,0.06)',
  },
  hint: { fontFamily: fonts.bold, color: '#fff', fontSize: 15, marginTop: 22, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 6 },

  resultPad: { padding: 20 },
  srcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  srcBadge: {
    fontFamily: fonts.extrabold, fontSize: 11, color: colors.ink, backgroundColor: colors.volt,
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.sm, overflow: 'hidden',
  },
  code: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  foundName: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginBottom: 16 },
  macrosRow: { flexDirection: 'row', gap: 12 },
  macroBox: { flex: 1, backgroundColor: colors.bgElev, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  macroNum: { fontFamily: fonts.display, fontSize: 30 },
  macroLbl: { fontFamily: fonts.medium, fontSize: 11, color: colors.textDim, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  qtyLabel: { fontFamily: fonts.medium, color: colors.textDim, fontSize: 14 },
  qty: {
    width: 70, backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: 11, textAlign: 'center',
    color: colors.text, fontFamily: fonts.extrabold, fontSize: 17, borderWidth: 1.5, borderColor: colors.border,
  },
  linkBtn: { alignSelf: 'center', marginTop: 14, padding: 6 },
  link: { fontFamily: fonts.bold, color: colors.volt, fontSize: 14 },
});
