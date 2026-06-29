// Nutrition goal calculations for a caloric surplus (muscle gain).

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'יושבני (מעט/ללא פעילות)', factor: 1.2 },
  { key: 'light', label: 'קל (1-3 ימים בשבוע)', factor: 1.375 },
  { key: 'moderate', label: 'בינוני (3-5 ימים בשבוע)', factor: 1.55 },
  { key: 'active', label: 'פעיל (6-7 ימים בשבוע)', factor: 1.725 },
  { key: 'veryActive', label: 'פעיל מאוד (אימון יומי קשה)', factor: 1.9 },
];

export const SURPLUS_LEVELS = [
  { key: 'lean', label: 'מסה רזה (+250 קק״ל)', surplus: 250 },
  { key: 'standard', label: 'מסה רגילה (+400 קק״ל)', surplus: 400 },
  { key: 'aggressive', label: 'מסה אגרסיבית (+600 קק״ל)', surplus: 600 },
];

export const DEFAULT_PROFILE = {
  heightCm: 190,
  weightKg: 60,
  age: 25,
  sex: 'male', // 'male' | 'female'
  activity: 'moderate',
  surplus: 'standard',
  proteinPerKg: 2.0, // g of protein per kg bodyweight for muscle gain
};

// Coerce a numeric profile field to a finite, positive number, falling back to
// a default so an empty string or NaN can never produce NaN/0 goals.
function safe(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function activityFactor(key) {
  const a = ACTIVITY_LEVELS.find((l) => l.key === key);
  return a ? a.factor : 1.55;
}

function surplusKcal(key) {
  const s = SURPLUS_LEVELS.find((l) => l.key === key);
  return s ? s.surplus : 400;
}

// Mifflin-St Jeor Basal Metabolic Rate
export function calcBMR({ weightKg, heightCm, age, sex }) {
  const w = safe(weightKg, DEFAULT_PROFILE.weightKg);
  const h = safe(heightCm, DEFAULT_PROFILE.heightCm);
  const a = safe(age, DEFAULT_PROFILE.age);
  const base = 10 * w + 6.25 * h - 5 * a;
  return sex === 'female' ? base - 161 : base + 5;
}

// Returns { bmr, tdee, calories, protein }
export function computeGoals(profile) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const bmr = calcBMR(p);
  const tdee = bmr * activityFactor(p.activity);
  const calories = Math.round(tdee + surplusKcal(p.surplus));
  const protein = Math.round((p.proteinPerKg || 2.0) * safe(p.weightKg, DEFAULT_PROFILE.weightKg));
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
  };
}
