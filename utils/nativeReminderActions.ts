import { Platform } from "react-native";

import { useHabitStore } from "@/store/habitStore";
import { drainAndroidNativeReminderActions } from "@/utils/androidNativeReminderActions";
import { drainIosNativeReminderActions } from "@/utils/iosNativeReminderActions";

type PersistedHabitStore = typeof useHabitStore & {
  persist: {
    rehydrate: () => Promise<void> | void;
  };
};

const rehydrateAndroidHabitStore = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  await (useHabitStore as PersistedHabitStore).persist.rehydrate();
};

export const syncNativeReminderActionState = async () => {
  await drainIosNativeReminderActions();
  await rehydrateAndroidHabitStore();
  await drainAndroidNativeReminderActions();
};
