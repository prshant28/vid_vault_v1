import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface StreakData {
  lastDate: string;
  count: number;
}

const REMINDER_KEY = "vv_reminder_v1";
const STREAK_KEY   = "vv_streak_v1";

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 8, minute: 0 };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_REMINDER;
}

export async function saveReminderSettings(s: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(s));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleDaily(
  hour: number,
  minute: number,
  streakCount: number,
  videoTitle?: string,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const body = videoTitle
      ? `Review: "${videoTitle}"`
      : "Keep your learning streak alive — open VidVault!";
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 Day ${streakCount} Streak — Keep going!`,
        body,
        data: { type: "daily-reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      } as any,
    });
  } catch {}
}

export async function cancelDaily(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function updateStreak(): Promise<StreakData> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (raw) {
      const data: StreakData = JSON.parse(raw);
      if (data.lastDate === today) return data;
      const prev = new Date(data.lastDate);
      const diff = Math.floor((Date.now() - prev.getTime()) / 86400000);
      const count = diff === 1 ? data.count + 1 : 1;
      const updated: StreakData = { lastDate: today, count };
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch {}
  const fresh: StreakData = { lastDate: today, count: 1 };
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(fresh));
  return fresh;
}

export async function getStreak(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastDate: "", count: 0 };
}
