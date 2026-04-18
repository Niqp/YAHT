import dayjs from "dayjs";

import type { Habit, HabitMap, ReminderConfig } from "@/types/habit";
import { isHabitDueOnDate } from "@/utils/date";
import {
  getReminderNotificationIdentifier,
  getReminderNotificationSeriesId,
  MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE,
} from "@/utils/notifications";

export const NORMAL_REMINDER_NOTIFICATION_LIMIT = 63;
export const REMINDER_OVERFLOW_PROBE_LIMIT = NORMAL_REMINDER_NOTIFICATION_LIMIT + 1;
export const MAX_REMINDER_LOOKAHEAD_DAYS = 366;
export const MAX_NAG_WINDOW_MS = 12 * 60 * 60 * 1000;
export const MIN_REPEAT_INTERVAL_MS = 5 * 60 * 1000;
export const STOP_REMINDER_NOTIFICATION_ID = "reminder-stop";
export const STOP_REMINDER_MIN_DELAY_MS = 60 * 1000;

export type ReminderQueueJob = {
  notificationId: string;
  habitId: string;
  habitTitle: string;
  timestamp: number;
  reminderDate: string;
  reminderSeriesId: string;
  attemptNumber: number;
  maxAttempts: number;
  repeatIntervalMs?: number;
};

export type StopReminderQueueJob = {
  notificationId: typeof STOP_REMINDER_NOTIFICATION_ID;
  timestamp: number;
  overflowTimestamp: number;
};

export type ReminderQueue = {
  normalJobs: ReminderQueueJob[];
  stopJob?: StopReminderQueueJob;
  hasOverflow: boolean;
  scannedDays: number;
};

const getNormalizedRepeatIntervalMs = (repeatIntervalMs?: number) => {
  if (typeof repeatIntervalMs !== "number" || !Number.isFinite(repeatIntervalMs)) {
    return undefined;
  }

  const normalizedIntervalMs = Math.floor(repeatIntervalMs);
  if (normalizedIntervalMs < MIN_REPEAT_INTERVAL_MS) {
    return undefined;
  }

  return normalizedIntervalMs;
};

const getReminderStartTime = (scheduleTime: dayjs.Dayjs, reminder: ReminderConfig, reminderDate: string) => {
  if (reminder.snoozedDate !== reminderDate || typeof reminder.snoozedUntilMs !== "number") {
    return scheduleTime;
  }

  if (!Number.isFinite(reminder.snoozedUntilMs)) {
    return scheduleTime;
  }

  const snoozedUntil = dayjs(reminder.snoozedUntilMs);
  if (!snoozedUntil.isValid() || !snoozedUntil.isAfter(scheduleTime)) {
    return scheduleTime;
  }

  return snoozedUntil;
};

const addReminderCandidate = (
  candidates: ReminderQueueJob[],
  candidateIds: Set<string>,
  candidate: Omit<ReminderQueueJob, "notificationId">
) => {
  if (!Number.isFinite(candidate.timestamp)) {
    return;
  }

  const notificationId = getReminderNotificationIdentifier(candidate.reminderSeriesId, candidate.timestamp);
  if (candidateIds.has(notificationId)) {
    return;
  }

  candidateIds.add(notificationId);
  candidates.push({
    ...candidate,
    notificationId,
  });
};

const compareReminderJobs = (left: ReminderQueueJob, right: ReminderQueueJob) => {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp - right.timestamp;
  }

  const habitComparison = left.habitId.localeCompare(right.habitId);
  if (habitComparison !== 0) {
    return habitComparison;
  }

  const dateComparison = left.reminderDate.localeCompare(right.reminderDate);
  if (dateComparison !== 0) {
    return dateComparison;
  }

  return left.attemptNumber - right.attemptNumber;
};

const getSortedHabits = (habits: HabitMap) =>
  Object.values(habits).sort((left, right) => left.id.localeCompare(right.id));

const addHabitCandidatesForDate = (
  candidates: ReminderQueueJob[],
  candidateIds: Set<string>,
  habit: Habit,
  targetDate: dayjs.Dayjs,
  now: dayjs.Dayjs,
  dayOffset: number
) => {
  const reminder = habit.reminder;
  if (!reminder?.enabled) {
    return;
  }

  const reminderDate = targetDate.format("YYYY-MM-DD");
  if (habit.completionHistory[reminderDate]?.isCompleted || !isHabitDueOnDate(habit, reminderDate)) {
    return;
  }

  const configuredScheduleTime = targetDate.hour(reminder.hour).minute(reminder.minute).second(0).millisecond(0);
  const reminderStartTime = getReminderStartTime(configuredScheduleTime, reminder, reminderDate);
  const endOfDay = targetDate.endOf("day");

  if (reminderStartTime.isAfter(endOfDay)) {
    return;
  }

  const repeatIntervalMs = reminder.repeatIfNotCompleted
    ? getNormalizedRepeatIntervalMs(reminder.repeatIntervalMs)
    : undefined;
  const reminderSeriesId = getReminderNotificationSeriesId(habit.id, reminderDate);
  const maxAttempts = repeatIntervalMs ? MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE + 1 : 1;

  if (!reminderStartTime.isBefore(now)) {
    addReminderCandidate(candidates, candidateIds, {
      habitId: habit.id,
      habitTitle: habit.title,
      timestamp: reminderStartTime.valueOf(),
      reminderDate,
      reminderSeriesId,
      attemptNumber: 0,
      maxAttempts,
      repeatIntervalMs,
    });
  }

  if (!repeatIntervalMs) {
    return;
  }

  let nextAttemptNumber = 1;
  let nextNag = reminderStartTime.add(repeatIntervalMs, "ms");

  if (reminderStartTime.isBefore(now) && dayOffset === 0) {
    const diffMs = now.diff(reminderStartTime);
    if (diffMs <= 0 || diffMs >= MAX_NAG_WINDOW_MS) {
      return;
    }

    const intervalsPassed = Math.floor(diffMs / repeatIntervalMs);
    nextAttemptNumber = intervalsPassed + 1;
    nextNag = reminderStartTime.add(nextAttemptNumber * repeatIntervalMs, "ms");
  }

  while (
    !nextNag.isAfter(endOfDay) &&
    nextNag.diff(reminderStartTime) < MAX_NAG_WINDOW_MS &&
    nextAttemptNumber <= MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE
  ) {
    if (!nextNag.isBefore(now)) {
      addReminderCandidate(candidates, candidateIds, {
        habitId: habit.id,
        habitTitle: habit.title,
        timestamp: nextNag.valueOf(),
        reminderDate,
        reminderSeriesId,
        attemptNumber: nextAttemptNumber,
        maxAttempts,
        repeatIntervalMs,
      });
    }

    nextAttemptNumber += 1;
    nextNag = nextNag.add(repeatIntervalMs, "ms");
  }
};

export const buildReminderQueue = ({
  habits,
  nowMs = Date.now(),
}: {
  habits: HabitMap;
  nowMs?: number;
}): ReminderQueue => {
  const candidates: ReminderQueueJob[] = [];
  const candidateIds = new Set<string>();
  const now = dayjs(nowMs);
  const sortedHabits = getSortedHabits(habits);
  let scannedDays = 0;

  for (let dayOffset = 0; dayOffset < MAX_REMINDER_LOOKAHEAD_DAYS; dayOffset++) {
    const targetDate = now.add(dayOffset, "day");
    scannedDays = dayOffset + 1;

    for (const habit of sortedHabits) {
      addHabitCandidatesForDate(candidates, candidateIds, habit, targetDate, now, dayOffset);
    }

    if (candidates.length >= REMINDER_OVERFLOW_PROBE_LIMIT) {
      break;
    }
  }

  const sortedCandidates = candidates.sort(compareReminderJobs);
  const normalJobs = sortedCandidates.slice(0, NORMAL_REMINDER_NOTIFICATION_LIMIT);
  const overflowJob = sortedCandidates[NORMAL_REMINDER_NOTIFICATION_LIMIT];

  if (!overflowJob) {
    return {
      normalJobs,
      hasOverflow: false,
      scannedDays,
    };
  }

  const lastNormalJob = normalJobs.at(-1);
  let stopTimestamp = Math.max(overflowJob.timestamp, now.valueOf() + STOP_REMINDER_MIN_DELAY_MS);
  if (lastNormalJob && stopTimestamp <= lastNormalJob.timestamp) {
    stopTimestamp = lastNormalJob.timestamp + STOP_REMINDER_MIN_DELAY_MS;
  }

  return {
    normalJobs,
    stopJob: {
      notificationId: STOP_REMINDER_NOTIFICATION_ID,
      timestamp: stopTimestamp,
      overflowTimestamp: overflowJob.timestamp,
    },
    hasOverflow: true,
    scannedDays,
  };
};
