import type { TimeChangeEvent } from "@niqp/react-native-android-time-change";

import { useHabitStore } from "@/store/habitStore";
import { getCurrentDateStamp } from "@/utils/date";
import { waitForHabitStoreHydration } from "@/utils/habitStoreHydration";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

export const TIME_CHANGE_HEADLESS_TASK = "YAHTTimeChangeTask";

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
