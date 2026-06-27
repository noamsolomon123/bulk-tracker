import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Default meal reminder times (24h). Each fires daily when enabled.
export const DEFAULT_REMINDER_TIMES = [
  { hour: 8, minute: 0, label: 'Breakfast' },
  { hour: 12, minute: 30, label: 'Lunch' },
  { hour: 16, minute: 0, label: 'Snack' },
  { hour: 20, minute: 0, label: 'Dinner' },
];

// Foreground display behaviour.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meal-reminders', {
      name: 'Meal Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

export async function requestPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    status = req.status;
  }
  return status === 'granted';
}

// Cancel any previously scheduled reminders.
export async function cancelMealReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedule one daily repeating notification per meal time.
export async function scheduleMealReminders(times = DEFAULT_REMINDER_TIMES) {
  await ensureAndroidChannel();
  await cancelMealReminders();
  for (const t of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time to eat — ${t.label} 🍽️`,
        body: 'Log your meal and keep hitting your calorie & protein goals.',
        ...(Platform.OS === 'android' ? { channelId: 'meal-reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
      },
    });
  }
}

export function formatTime({ hour, minute }) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}
