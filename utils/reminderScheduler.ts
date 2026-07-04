import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { useHabitStore } from "@/store/habitStore";
import type { HabitMap } from "@/types/habit";
import { isHabitDueOnDate } from "@/utils/date";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import {
  isReminderNotificationData,
  isReminderQueueStopNotificationData,
  prepareReminderNotifications,
  REMINDER_NOTIFICATION_PREFIX,
  schedulePreparedReminderNotification,
  scheduleReminderQueueStopNotification,
} from "@/utils/notifications";
import { buildReminderQueue, type ReminderQueueJob, type StopReminderQueueJob } from "@/utils/reminderQueue";
import {
  createEmptyReminderScheduleLedger,
  getReminderScheduleLedger,
  REMINDER_SCHEDULE_LEDGER_VERSION,
  saveReminderScheduleLedger,
  type ReminderScheduleLedgerEntry,
  type StopReminderScheduleLedgerEntry,
} from "@/utils/reminderScheduleLedger";

export type ReminderReconcileReason =
  | "startup"
  | "foreground"
  | "background"
  | "habit-change"
  | "notification-response"
  | "time-change"
  | "manual";

type DesiredReminderEntry = ReminderQueueJob & {
  signature: string;
};

type DesiredStopEntry = StopReminderQueueJob & {
  signature: string;
};

const createReminderSignature = (job: ReminderQueueJob) =>
  JSON.stringify({
    version: REMINDER_SCHEDULE_LEDGER_VERSION,
    platform: Platform.OS,
    type: "normal",
    habitId: job.habitId,
    habitTitle: job.habitTitle,
    timestamp: job.timestamp,
    reminderDate: job.reminderDate,
    reminderSeriesId: job.reminderSeriesId,
    attemptNumber: job.attemptNumber,
    maxAttempts: job.maxAttempts,
    repeatIntervalMs: job.repeatIntervalMs,
  });

const createStopSignature = (job: StopReminderQueueJob) =>
  JSON.stringify({
    version: REMINDER_SCHEDULE_LEDGER_VERSION,
    platform: Platform.OS,
    type: "stop",
    timestamp: job.timestamp,
    overflowTimestamp: job.overflowTimestamp,
  });

const getLedgerEntriesById = (entries: ReminderScheduleLedgerEntry[]) =>
  new Map(entries.map((entry) => [entry.notificationId, entry]));

const getScheduledReminderIds = (notifications: Notifications.NotificationRequest[]) =>
  notifications
    .filter((notification) => notification.identifier.startsWith(REMINDER_NOTIFICATION_PREFIX))
    .map((notification) => notification.identifier);

const cancelScheduledNotificationIdentifiers = async (identifiers: string[]) => {
  if (identifiers.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    identifiers.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier))
  );
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Failed to cancel stale reminder notification:", result.reason);
    }
  });
};

const dismissPresentedNotificationIdentifiers = async (identifiers: string[]) => {
  if (identifiers.length === 0 || Platform.OS === "web") {
    return;
  }

  const results = await Promise.allSettled(
    identifiers.map((identifier) => Notifications.dismissNotificationAsync(identifier))
  );
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Failed to dismiss stale reminder notification:", result.reason);
    }
  });
};

const shouldDismissPresentedReminder = ({ data, habits }: { data: unknown; habits: HabitMap }) => {
  if (isReminderQueueStopNotificationData(data)) {
    return false;
  }

  if (!isReminderNotificationData(data)) {
    return true;
  }

  const habit = habits[data.habitId];
  if (!habit?.reminder?.enabled) {
    return true;
  }

  if (habit.completionHistory[data.reminderDate]?.isCompleted) {
    return true;
  }

  if (!isHabitDueOnDate(habit, data.reminderDate)) {
    return true;
  }

  const { snoozedDate, snoozedUntilMs } = habit.reminder;
  return (
    snoozedDate === data.reminderDate &&
    typeof snoozedUntilMs === "number" &&
    Number.isFinite(snoozedUntilMs) &&
    data.scheduledFor < snoozedUntilMs
  );
};

const dismissInvalidPresentedReminderNotifications = async ({
  desiredStopNotificationId,
  habits,
}: {
  desiredStopNotificationId?: string;
  habits: HabitMap;
}) => {
  if (Platform.OS === "web") {
    return;
  }

  const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
  const identifiersToDismiss = presentedNotifications
    .filter((notification) => notification.request.identifier.startsWith(REMINDER_NOTIFICATION_PREFIX))
    .filter((notification) => {
      const data = notification.request.content.data;
      if (isReminderQueueStopNotificationData(data)) {
        return notification.request.identifier !== desiredStopNotificationId;
      }

      return shouldDismissPresentedReminder({ data, habits });
    })
    .map((notification) => notification.request.identifier);

  await dismissPresentedNotificationIdentifiers(identifiersToDismiss);
};

export const reconcileReminderNotifications = async ({
  reason: _reason = "manual",
  habits = useHabitStore.getState().habits,
  nowMs = Date.now(),
  timeZone,
  utcOffsetMinutes,
  dismissPresented = true,
}: {
  reason?: ReminderReconcileReason;
  habits?: HabitMap;
  nowMs?: number;
  timeZone?: string;
  utcOffsetMinutes?: number;
  dismissPresented?: boolean;
} = {}) => {
  logEvent("reminder.reconcile.started", { reason: _reason, habitCount: Object.keys(habits).length });
  try {
    if (Platform.OS === "web") {
      saveReminderScheduleLedger(createEmptyReminderScheduleLedger(nowMs));
      logEvent("reminder.reconcile.completed", { reason: _reason, platform: "web", scheduledCount: 0 });
      return;
    }

    const queue = buildReminderQueue({ habits, nowMs, timeZone, utcOffsetMinutes });
    const desiredEntries: DesiredReminderEntry[] = queue.normalJobs.map((job) => ({
      ...job,
      signature: createReminderSignature(job),
    }));
    const desiredStopEntry: DesiredStopEntry | undefined = queue.stopJob
      ? {
          ...queue.stopJob,
          signature: createStopSignature(queue.stopJob),
        }
      : undefined;

    const ledger = getReminderScheduleLedger();
    const ledgerEntriesById = getLedgerEntriesById(ledger.normalNotifications);
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledReminderIds = new Set(getScheduledReminderIds(scheduledNotifications));
    const desiredEntriesById = new Map(desiredEntries.map((entry) => [entry.notificationId, entry]));
    const ledgerReminderIds = new Set([
      ...ledger.normalNotifications.map((entry) => entry.notificationId),
      ...(ledger.stopNotification ? [ledger.stopNotification.notificationId] : []),
    ]);

    const idsToCancel = new Set<string>();
    for (const scheduledId of scheduledReminderIds) {
      const desiredEntry = desiredEntriesById.get(scheduledId);
      const ledgerEntry = ledgerEntriesById.get(scheduledId);
      const isDesiredStop = desiredStopEntry?.notificationId === scheduledId;
      const isUnchangedStop =
        isDesiredStop &&
        ledger.stopNotification?.notificationId === scheduledId &&
        ledger.stopNotification.signature === desiredStopEntry.signature;

      if (!desiredEntry && !isDesiredStop) {
        idsToCancel.add(scheduledId);
        continue;
      }

      if (desiredEntry && (!ledgerEntry || ledgerEntry.signature !== desiredEntry.signature)) {
        idsToCancel.add(scheduledId);
      }

      if (isDesiredStop && !isUnchangedStop) {
        idsToCancel.add(scheduledId);
      }
    }

    for (const ledgerId of ledgerReminderIds) {
      if (!scheduledReminderIds.has(ledgerId) && !desiredEntriesById.has(ledgerId)) {
        idsToCancel.add(ledgerId);
      }
    }

    await cancelScheduledNotificationIdentifiers([...idsToCancel]);

    const scheduledAtMs = Date.now();
    const nextLedgerEntries: ReminderScheduleLedgerEntry[] = [];
    const reminderEntriesToSchedule: DesiredReminderEntry[] = [];

    for (const desiredEntry of desiredEntries) {
      const ledgerEntry = ledgerEntriesById.get(desiredEntry.notificationId);
      const isAlreadyScheduled =
        scheduledReminderIds.has(desiredEntry.notificationId) &&
        !idsToCancel.has(desiredEntry.notificationId) &&
        ledgerEntry?.signature === desiredEntry.signature;

      if (isAlreadyScheduled && ledgerEntry) {
        nextLedgerEntries.push(ledgerEntry);
        continue;
      }

      reminderEntriesToSchedule.push(desiredEntry);
    }

    let nextStopLedgerEntry: StopReminderScheduleLedgerEntry | undefined;
    let stopEntryToSchedule: DesiredStopEntry | undefined;
    if (desiredStopEntry) {
      const isStopAlreadyScheduled =
        scheduledReminderIds.has(desiredStopEntry.notificationId) &&
        !idsToCancel.has(desiredStopEntry.notificationId) &&
        ledger.stopNotification?.signature === desiredStopEntry.signature;

      if (isStopAlreadyScheduled && ledger.stopNotification) {
        nextStopLedgerEntry = ledger.stopNotification;
      } else {
        stopEntryToSchedule = desiredStopEntry;
      }
    }

    const needsScheduling = reminderEntriesToSchedule.length > 0 || !!stopEntryToSchedule;
    if (needsScheduling) {
      const canScheduleReminders = await prepareReminderNotifications();
      if (!canScheduleReminders) {
        saveReminderScheduleLedger({
          version: REMINDER_SCHEDULE_LEDGER_VERSION,
          generatedAtMs: nowMs,
          normalNotifications: nextLedgerEntries,
          stopNotification: nextStopLedgerEntry,
        });
        logEvent("reminder.reconcile.completed", {
          reason: _reason,
          canSchedule: false,
          scheduledCount: nextLedgerEntries.length,
        });
        return;
      }

      for (const desiredEntry of reminderEntriesToSchedule) {
        const scheduledId = await schedulePreparedReminderNotification(desiredEntry);
        if (scheduledId) {
          nextLedgerEntries.push({
            ...desiredEntry,
            scheduledAtMs,
          });
        }
      }

      if (stopEntryToSchedule) {
        const scheduledId = await scheduleReminderQueueStopNotification({
          timestamp: stopEntryToSchedule.timestamp,
          overflowTimestamp: stopEntryToSchedule.overflowTimestamp,
        });

        if (scheduledId) {
          nextStopLedgerEntry = {
            ...stopEntryToSchedule,
            scheduledAtMs,
          };
        }
      }
    }

    saveReminderScheduleLedger({
      version: REMINDER_SCHEDULE_LEDGER_VERSION,
      generatedAtMs: nowMs,
      normalNotifications: nextLedgerEntries,
      stopNotification: nextStopLedgerEntry,
    });

    if (dismissPresented) {
      await dismissInvalidPresentedReminderNotifications({
        desiredStopNotificationId: desiredStopEntry?.notificationId,
        habits,
      });
    }
    logEvent("reminder.reconcile.completed", {
      reason: _reason,
      habitCount: Object.keys(habits).length,
      scheduledCount: nextLedgerEntries.length,
      hasOverflow: !!nextStopLedgerEntry,
      count: idsToCancel.size,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reconciling reminder notifications: ${error.message}`, error);
    }
    logError("reminder.reconcile.failed", { operation: "reconcileReminderNotifications", reason: _reason, error });
  }
};
