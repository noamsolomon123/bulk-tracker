// Nutrition goal calculations for a caloric surplus (muscle gain).

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary (little/no exercise)', factor: 1.2 },
  { key: 'light', label: 'Light (1-3 days/week)', factor: 1.375 },
  { key: 'moderate', label: 'Moderate (3-5 days/week)', factor: 1.55 },
  { key: 'active', label: 'Active (6-7 days/week)', factor: 1.725 },
  { key: 'veryActive', label: 'Very Active (hard daily training)', factor: 1.9 },
];

export const SURPLUS_LEVELS = [
  { key: 'lean', label: 'Lean bulk (+250 kcal)', surplus: 250 },
  { key: 'standard', label: 'Standard bulk (+400 kcal)', surplus: 400 },
  { key: 'aggressive', label: 'Aggressive bulk (+600 kcal)', surplus: 600 },
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
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

// Returns { bmr, tdee, calories, protein }
export function computeGoals(profile) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const bmr = calcBMR(p);
  const tdee = bmr * activityFactor(p.activity);
  const calories = Math.round(tdee + surplusKcal(p.surplus));
  const protein = Math.round((p.proteinPerKg || 2.0) * p.weightKg);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
  };
}
