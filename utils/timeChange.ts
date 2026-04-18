import type { TimeChangeEvent } from "@niqp/react-native-android-time-change";

import { useHabitStore } from "@/store/habitStore";
import { getCurrentDateStamp } from "@/utils/date";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

export const TIME_CHANGE_HEADLESS_TASK = "YAHTTimeChangeTask";

const waitForHabitStoreHydration = async (timeoutMs = 2_000): Promise<boolean> => {
  if (useHabitStore.getState()._hasHydrated) {
    return true;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(useHabitStore.getState()._hasHydrated);
    }, timeoutMs);

    const unsubscribe = useHabitStore.subscribe((state) => {
      if (!state._hasHydrated) {
        return;
      }

      clearTimeout(timeout);
      unsubscribe();
      resolve(true);
    });
  });
};

export const handleTimeChangeEvent = async (_event: TimeChangeEvent): Promise<void> => {
  try {
    const isHydrated = await waitForHabitStoreHydration();
    if (!isHydrated) {
      return;
    }

    const { reconcileActiveTimers, selectedDate, setSelectedDate } = useHabitStore.getState();
    await reconcileActiveTimers();

    const today = getCurrentDateStamp();
    if (today > selectedDate) {
      setSelectedDate(today);
    }

    await reconcileReminderNotifications({ reason: "time-change" });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error handling Android time change event: ${error.message}`, error);
    }
  }
};
