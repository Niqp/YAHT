import { getCurrentTimeContext, type TimeChangeEvent } from "@niqp/react-native-android-time-change";

import { useHabitStore } from "@/store/habitStore";
import { getCurrentDateStamp } from "@/utils/date";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { waitForHabitStoreHydration } from "@/utils/habitStoreHydration";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

export const TIME_CHANGE_HEADLESS_TASK = "YAHTTimeChangeTask";

let lastKnownNativeTimeZone: string | undefined;

const getEffectiveTimeZone = async (event: TimeChangeEvent) => {
  if (event.timeZone) {
    lastKnownNativeTimeZone = event.timeZone;
    return event.timeZone;
  }

  if (lastKnownNativeTimeZone) {
    return lastKnownNativeTimeZone;
  }

  try {
    const currentContext = await getCurrentTimeContext();
    lastKnownNativeTimeZone = currentContext.timeZone;
    return currentContext.timeZone;
  } catch {
    return undefined;
  }
};

export const handleTimeChangeEvent = async (event: TimeChangeEvent): Promise<void> => {
  logEvent("timeChange.received", {
    action: event.action,
    timeZone: event.timeZone,
    utcOffsetMinutes: event.utcOffsetMinutes,
  });
  try {
    const isHydrated = await waitForHabitStoreHydration();
    logEvent("timeChange.hydrationChecked", { hydrated: isHydrated });
    if (!isHydrated) {
      return;
    }

    const { reconcileActiveTimers, selectedDate, setSelectedDate } = useHabitStore.getState();
    await reconcileActiveTimers();
    logEvent("timeChange.timersReconciled", { action: event.action });

    const today = getCurrentDateStamp();
    if (today > selectedDate) {
      setSelectedDate(today);
      logEvent("timeChange.selectedDateAdjusted", { selectedDate: today });
    }

    const timeZone = await getEffectiveTimeZone(event);
    await reconcileReminderNotifications({
      reason: "time-change",
      timeZone,
      utcOffsetMinutes: event.utcOffsetMinutes,
    });
    logEvent("timeChange.completed", {
      action: event.action,
      timeZone,
      utcOffsetMinutes: event.utcOffsetMinutes,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error handling Android time change event: ${error.message}`, error);
    }
    logError("timeChange.failed", { operation: "handleTimeChangeEvent", action: event.action, error });
  }
};
