import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  PROFILE: 'ct.profile.v1',
  CUSTOM_FOODS: 'ct.customFoods.v1',
  LOG: 'ct.log.v1',
  SETTINGS: 'ct.settings.v1',
};

export async function loadJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return fallback;
  }
}

export async function saveJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Failed to save ${key}`, e);
    return false;
  }
}
