import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
};

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
      setCustomFoods(cf);
      setLog(lg);
      setSettings({ ...DEFAULT_SETTINGS, ...st });
      setHydrated(true);
    })();
  }, []);

  // Persist each slice when it changes (after hydration).
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.PROFILE, profile);
  }, [profile, hydrated]);
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.CUSTOM_FOODS, customFoods);
  }, [customFoods, hydrated]);
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.LOG, log);
  }, [log, hydrated]);
  useEffect(() => {
    if (hydrated) saveJSON(KEYS.SETTINGS, settings);
  }, [settings, hydrated]);

  const goals = useMemo(() => computeGoals(profile), [profile]);

  const allFoods = useMemo(
    () => [...customFoods, ...STARTER_FOODS],
    [customFoods]
  );

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const addCustomFood = useCallback((food) => {
    const entry = {
      id: makeId('food'),
      custom: true,
      name: food.name.trim(),
      servingLabel: food.servingLabel?.trim() || '1 serving',
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
    (dayKey = todayKey()) => {
      const entries = log.filter((e) => e.date === dayKey);
      const calories = entries.reduce((s, e) => s + e.calories, 0);
      const protein = Math.round(entries.reduce((s, e) => s + e.protein, 0) * 10) / 10;
      return { entries, calories, protein };
    },
    [log]
  );

  const setRemindersEnabled = useCallback(
    async (enabled) => {
      if (enabled) {
        const granted = await requestPermissions();
        if (!granted) {
          return false; // caller can show a message
        }
        await scheduleMealReminders(settings.reminderTimes);
      } else {
        await cancelMealReminders();
      }
      setSettings((prev) => ({ ...prev, remindersEnabled: enabled }));
      return true;
    },
    [settings.reminderTimes]
  );

  const value = {
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
    setRemindersEnabled,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
