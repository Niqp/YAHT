import * as Notifications from "expo-notifications";

import { REMINDER_NOTIFICATION_TASK } from "@/utils/reminderNotificationTask";
import {
  handleReminderNotificationResponse,
  isReminderQuickActionResponse,
} from "@/utils/reminderNotificationResponse";
import { waitForHabitStoreHydration } from "@/utils/habitStoreHydration";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { appendReminderActionDebugRecord } from "@/utils/reminderActionDebugLog";

let hasRegisteredTask = false;
let hasRegisteredEarlyListener = false;
let earlyReminderTaskQueue: Promise<unknown> = Promise.resolve();

const enqueueEarlyReminderTask = <T>(task: () => Promise<T>) => {
  const nextTask = earlyReminderTaskQueue.then(task, task);
  earlyReminderTaskQueue = nextTask.then(
    () => undefined,
    () => undefined
  );
  return nextTask;
};

export const registerReminderNotificationTask = (): void => {
  if (!hasRegisteredTask) {
    hasRegisteredTask = true;
    Notifications.registerTaskAsync(REMINDER_NOTIFICATION_TASK).catch((error) => {
      console.error("Error registering reminder notification task:", error);
      logError("reminder.task.registerFailed", { operation: "registerTaskAsync", error });
    });
    logEvent("reminder.task.registered", { operation: "registerReminderNotificationTask" });
  }

  if (!hasRegisteredEarlyListener) {
    hasRegisteredEarlyListener = true;
    Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isReminderQuickActionResponse(response)) {
        return;
      }

      void enqueueEarlyReminderTask(async () => {
        const isHydrated = await waitForHabitStoreHydration();
        appendReminderActionDebugRecord({
          event: "js-early-listener-hydration",
          actionId: response.actionIdentifier,
          notificationId: response.notification.request.identifier,
          detail: `hydrated=${isHydrated}`,
        });
        logEvent("reminder.earlyListener.hydrationChecked", {
          actionId: response.actionIdentifier,
          notificationId: response.notification.request.identifier,
          hydrated: isHydrated,
        });
        if (!isHydrated) {
          return;
        }

        const result = await handleReminderNotificationResponse(response, {
          allowNavigation: false,
          completionMode: "targeted-background",
        });
        appendReminderActionDebugRecord({
          event: "js-early-listener-result",
          actionId: response.actionIdentifier,
          notificationId: response.notification.request.identifier,
          detail: `handled=${result.handled}`,
        });
        logEvent("reminder.earlyListener.completed", {
          actionId: response.actionIdentifier,
          notificationId: response.notification.request.identifier,
          handled: result.handled,
        });
      });
    });
  }
};
