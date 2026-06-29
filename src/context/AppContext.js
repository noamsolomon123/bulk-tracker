import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AppState, Alert } from 'react-native';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';
import { STARTER_FOODS } from '../data/foods';
import { DEFAULT_PROFILE, computeGoals } from '../utils/nutrition';
import {
  scheduleMealReminders,
  cancelMealReminders,
  requestPermissions,
  DEFAULT_REMINDER_TIMES,
} from '../utils/notifications';

const DEFAULT_SETTINGS = {
  remindersEnabled: false,
  reminderTimes: DEFAULT_REMINDER_TIMES,
  geminiKey: '', // user-pasted Gemini API key (stored locally only)
  profileConfigured: false, // flips true on the first real profile edit
};

export const MY_FOODS_CAT = 'המזונות שלי';

const AppContext = createContext(null);

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

let idCounter = 0;
function makeId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [customFoods, setCustomFoods] = useState([]);
  const [log, setLog] = useState([]); // array of entries
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(Date.now());
  const saveErrorShown = useRef(false);

  // Load persisted state once.
  useEffect(() => {
    (async () => {
      const [p, cf, lg, st] = await Promise.all([
        loadJSON(KEYS.PROFILE, DEFAULT_PROFILE),
        loadJSON(KEYS.CUSTOM_FOODS, []),
        loadJSON(KEYS.LOG, []),
        loadJSON(KEYS.SETTINGS, DEFAULT_SETTINGS),
      ]);
      setProfile({ ...DEFAULT_PROFILE, ...p });
      setCustomFoods(Array.isArray(cf) ? cf : []);
      // Drop corrupted/oversized persisted entries before they reach the reducers.
      const validLog = Array.isArray(lg)
        ? lg.filter(
            (e) =>
              e &&
              typeof e.name === 'string' &&
              typeof e.date === 'string' &&
              Number.isFinite(Number(e.calories)) &&
              Number.isFinite(Number(e.protein))
          )
        : [];
      setLog(validLog);
      // Normalize reminder times to the {id,label,hour,minute,enabled} shape.
      const rawTimes = (st && st.reminderTimes) || DEFAULT_REMINDER_TIMES;
      const reminderTimes = rawTimes.map((t, i) => ({
        id: t.id || `r${i}-${t.hour}-${t.minute}`,
        label: t.label || 'תזכורת',
        hour: t.hour,
        minute: t.minute,
        enabled: t.enabled !== false,
      }));
      setSettings({ ...DEFAULT_SETTINGS, ...st, reminderTimes });
      setHydrated(true);
    })();
  }, []);

  // Surface a one-time notice if a critical write fails (e.g. storage full),
  // so silent data loss isn't only discovered after a restart.
  const reportSaveFailure = useCallback(() => {
    if (saveErrorShown.current) return;
    saveErrorShown.current = true;
    Alert.alert(
      'שמירה נכשלה',
      'לא ניתן לשמור את הנתונים במכשיר — ייתכן שאחסון המכשיר מלא. פנה מקום כדי למנוע אובדן מידע.'
    );
  }, []);

  // Persist each slice when it changes (after hydration).
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.PROFILE, profile).then((ok) => { if (!ok) reportSaveFailure(); });
  }, [profile, hydrated, reportSaveFailure]);
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.CUSTOM_FOODS, customFoods);
  }, [customFoods, hydrated]);
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.LOG, log).then((ok) => { if (!ok) reportSaveFailure(); });
  }, [log, hydrated, reportSaveFailure]);
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.SETTINGS, settings);
  }, [settings, hydrated]);

  // Recompute the active day on resume and at the next local midnight, so a
  // foregrounded app rolls over to the new day instead of showing yesterday.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    let timer;
    const scheduleMidnight = () => {
      const d = new Date();
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 1, 0);
      timer = setTimeout(() => {
        tick();
        scheduleMidnight();
      }, next.getTime() - d.getTime());
    };
    scheduleMidnight();
    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Reschedule OS notifications as a pure side-effect whenever the master
  // toggle or the (enabled) reminder times change — keeps the setState updater
  // pure and picks up label/time edits so the OS schedule never goes stale.
  useEffect(() => {
    if (!hydrated) return;
    if (settings.remindersEnabled) {
      scheduleMealReminders(settings.reminderTimes).catch(() => {});
    }
  }, [hydrated, settings.remindersEnabled, settings.reminderTimes]);

  const goals = useMemo(() => computeGoals(profile), [profile]);

  const allFoods = useMemo(
    () => [...customFoods, ...STARTER_FOODS],
    [customFoods]
  );

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    // First real edit marks the profile as configured (drives the home cue).
    setSettings((prev) => (prev.profileConfigured ? prev : { ...prev, profileConfigured: true }));
  }, []);

  const addCustomFood = useCallback((food) => {
    const entry = {
      id: makeId('food'),
      custom: true,
      cat: MY_FOODS_CAT,
      name: food.name.trim(),
      servingLabel: food.servingLabel?.trim() || 'מנה',
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
    };
    setCustomFoods((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const deleteCustomFood = useCallback((id) => {
    setCustomFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addLogEntry = useCallback((food, quantity) => {
    const qty = Number(quantity) || 1;
    const entry = {
      id: makeId('log'),
      date: todayKey(),
      foodId: food.id,
      name: food.name,
      servingLabel: food.servingLabel,
      quantity: qty,
      calories: Math.round(food.calories * qty),
      protein: Math.round(food.protein * qty * 10) / 10,
    };
    setLog((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const deleteLogEntry = useCallback((id) => {
    setLog((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Entries + totals for a given day.
  const getDay = useCallback(
    (dayKey) => {
      const key = dayKey || todayKey(new Date(now));
      const entries = log.filter((e) => e.date === key);
      const calories = entries.reduce((s, e) => s + e.calories, 0);
      const protein = Math.round(entries.reduce((s, e) => s + e.protein, 0) * 10) / 10;
      return { entries, calories, protein };
    },
    [log, now]
  );

  // ── Stats aggregation ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const byDay = {};
    for (const e of log) {
      if (!byDay[e.date]) byDay[e.date] = { calories: 0, protein: 0, count: 0 };
      byDay[e.date].calories += e.calories;
      byDay[e.date].protein += e.protein;
      byDay[e.date].count += 1;
    }
    const days = Object.keys(byDay).sort();
    const totalCalories = Math.round(log.reduce((s, e) => s + e.calories, 0));
    const totalProtein = Math.round(log.reduce((s, e) => s + e.protein, 0) * 10) / 10;
    const daysTracked = days.length;
    const avgCalories = daysTracked ? Math.round(totalCalories / daysTracked) : 0;
    const avgProtein = daysTracked ? Math.round((totalProtein / daysTracked) * 10) / 10 : 0;
    const goalCal = goals.calories || 0;
    const daysOnTarget = days.filter((d) => byDay[d].calories >= goalCal).length;
    let bestProtein = 0;
    for (const d of days) bestProtein = Math.max(bestProtein, byDay[d].protein);
    // current streak: consecutive logged days counting back from today (or yesterday)
    let streak = 0;
    const cur = new Date(now);
    if (!byDay[todayKey(cur)]) cur.setDate(cur.getDate() - 1);
    while (byDay[todayKey(cur)]) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    }
    return {
      byDay, days, totalCalories, totalProtein, daysTracked, avgCalories, avgProtein,
      daysOnTarget, bestProtein: Math.round(bestProtein), streak, startDate: days[0] || null,
    };
  }, [log, goals.calories, now]);

  const getRecentDays = useCallback(
    (n = 14) => {
      const out = [];
      const today = new Date(now);
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = todayKey(d);
        const day = stats.byDay[key] || { calories: 0, protein: 0, count: 0 };
        out.push({ key, date: d, calories: day.calories, protein: day.protein, count: day.count });
      }
      return out;
    },
    [stats, now]
  );

  // ── Reminder management ─────────────────────────────────────────────
  const sortByTime = (arr) =>
    [...arr].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  const setReminderTimes = useCallback((updater) => {
    // Pure updater: rescheduling is handled by a dedicated effect.
    setSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev.reminderTimes) : updater;
      const reminderTimes = sortByTime(next);
      return { ...prev, reminderTimes };
    });
  }, []);

  const addReminder = useCallback(
    (r) =>
      setReminderTimes((prev) => [
        ...prev,
        { id: makeId('rem'), label: r.label || 'תזכורת', hour: r.hour, minute: r.minute, enabled: true },
      ]),
    [setReminderTimes]
  );
  const updateReminder = useCallback(
    (id, patch) => setReminderTimes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [setReminderTimes]
  );
  const deleteReminder = useCallback(
    (id) => setReminderTimes((prev) => prev.filter((t) => t.id !== id)),
    [setReminderTimes]
  );
  // Label-only edit: no need to reschedule on every keystroke.
  const renameReminder = useCallback((id, label) => {
    setSettings((prev) => ({
      ...prev,
      reminderTimes: prev.reminderTimes.map((t) => (t.id === id ? { ...t, label } : t)),
    }));
  }, []);

  const setRemindersEnabled = useCallback(
    async (enabled) => {
      if (enabled) {
        const granted = await requestPermissions();
        if (!granted) {
          return false; // caller can show a message
        }
        // Scheduling happens in the reschedule effect once the flag flips true.
      } else {
        await cancelMealReminders();
      }
      setSettings((prev) => ({ ...prev, remindersEnabled: enabled }));
      return true;
    },
    []
  );

  const setGeminiKey = useCallback((key) => {
    setSettings((prev) => ({ ...prev, geminiKey: (key || '').trim() }));
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      profile,
      goals,
      customFoods,
      allFoods,
      settings,
      updateProfile,
      addCustomFood,
      deleteCustomFood,
      addLogEntry,
      deleteLogEntry,
      getDay,
      stats,
      getRecentDays,
      setRemindersEnabled,
      addReminder,
      updateReminder,
      deleteReminder,
      renameReminder,
      setGeminiKey,
    }),
    [
      hydrated,
      profile,
      goals,
      customFoods,
      allFoods,
      settings,
      stats,
      updateProfile,
      addCustomFood,
      deleteCustomFood,
      addLogEntry,
      deleteLogEntry,
      getDay,
      getRecentDays,
      setRemindersEnabled,
      addReminder,
      updateReminder,
      deleteReminder,
      renameReminder,
      setGeminiKey,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
