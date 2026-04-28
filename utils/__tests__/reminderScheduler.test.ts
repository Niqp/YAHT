import dayjs from "dayjs";

import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";
import type { ReminderScheduleLedger } from "@/utils/reminderScheduleLedger";

const mockPrepareReminderNotifications = jest.fn();
const mockSchedulePreparedReminderNotification = jest.fn();
const mockScheduleReminderQueueStopNotification = jest.fn();
const mockGetAllScheduledNotificationsAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockGetPresentedNotificationsAsync = jest.fn();
const mockDismissNotificationAsync = jest.fn();
const mockGetReminderScheduleLedger = jest.fn();
const mockSaveReminderScheduleLedger = jest.fn();

jest.mock("expo-notifications", () => ({
  __esModule: true,
  getAllScheduledNotificationsAsync: (...args: unknown[]) => mockGetAllScheduledNotificationsAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduledNotificationAsync(...args),
  getPresentedNotificationsAsync: (...args: unknown[]) => mockGetPresentedNotificationsAsync(...args),
  dismissNotificationAsync: (...args: unknown[]) => mockDismissNotificationAsync(...args),
}));

jest.mock("@/store/habitStore", () => ({
  useHabitStore: {
    getState: () => ({ habits: {} }),
  },
}));

jest.mock("@/utils/notifications", () => ({
  MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE: 3,
  REMINDER_NOTIFICATION_PREFIX: "reminder-",
  getReminderNotificationIdentifier: (seriesId: string, timestamp: number) => `reminder-${seriesId}-${timestamp}`,
  getReminderNotificationSeriesId: (habitId: string, reminderDate: string) => `series-${habitId}-${reminderDate}`,
  isReminderNotificationData: (data: unknown) =>
    !!data && typeof data === "object" && (data as { kind?: string }).kind === "habitReminder",
  isReminderQueueStopNotificationData: (data: unknown) =>
    !!data && typeof data === "object" && (data as { kind?: string }).kind === "reminderQueueStop",
  prepareReminderNotifications: (...args: unknown[]) => mockPrepareReminderNotifications(...args),
  schedulePreparedReminderNotification: (...args: unknown[]) => mockSchedulePreparedReminderNotification(...args),
  scheduleReminderQueueStopNotification: (...args: unknown[]) => mockScheduleReminderQueueStopNotification(...args),
}));

jest.mock("@/utils/reminderScheduleLedger", () => ({
  REMINDER_SCHEDULE_LEDGER_VERSION: 1,
  createEmptyReminderScheduleLedger: (generatedAtMs = Date.now()) => ({
    version: 1,
    generatedAtMs,
    normalNotifications: [],
  }),
  getReminderScheduleLedger: (...args: unknown[]) => mockGetReminderScheduleLedger(...args),
  saveReminderScheduleLedger: (...args: unknown[]) => mockSaveReminderScheduleLedger(...args),
}));

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: "h1",
  title: "Stretch",
  icon: "*",
  repetition: { type: RepetitionType.DAILY },
  completion: { type: CompletionType.SIMPLE },
  completionHistory: {},
  createdAt: "2026-03-19",
  reminder: {
    enabled: true,
    hour: 9,
    minute: 0,
    repeatIfNotCompleted: false,
  },
  ...overrides,
});

const emptyLedger = (generatedAtMs = 0): ReminderScheduleLedger => ({
  version: 1,
  generatedAtMs,
  normalNotifications: [],
});

describe("reconcileReminderNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareReminderNotifications.mockResolvedValue(true);
    mockGetAllScheduledNotificationsAsync.mockResolvedValue([]);
    mockGetPresentedNotificationsAsync.mockResolvedValue([]);
    mockGetReminderScheduleLedger.mockReturnValue(emptyLedger());
    mockSchedulePreparedReminderNotification.mockImplementation((job) => Promise.resolve(job.notificationId));
    mockScheduleReminderQueueStopNotification.mockResolvedValue("reminder-stop");
    mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
    mockDismissNotificationAsync.mockResolvedValue(undefined);
  });

  it("schedules the derived 63 normal reminders plus the stop notification", async () => {
    await reconcileReminderNotifications({
      habits: { h1: makeHabit() },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(mockPrepareReminderNotifications).toHaveBeenCalledWith({ openAlarmSettings: false });
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledTimes(63);
    expect(mockScheduleReminderQueueStopNotification).toHaveBeenCalledTimes(1);
    expect(mockSaveReminderScheduleLedger).toHaveBeenCalledWith(
      expect.objectContaining({
        normalNotifications: expect.arrayContaining([
          expect.objectContaining({
            notificationId: `reminder-series-h1-2026-03-21-${dayjs("2026-03-21T09:00:00").valueOf()}`,
            reminderDate: "2026-03-21",
          }),
        ]),
        stopNotification: expect.objectContaining({
          notificationId: "reminder-stop",
        }),
      })
    );
  });

  it("cancels stale scheduled reminders and reschedules changed desired reminders", async () => {
    const firstTimestamp = dayjs("2026-03-21T09:00:00").valueOf();
    const firstId = `reminder-series-h1-2026-03-21-${firstTimestamp}`;

    mockGetAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: firstId, content: { data: {} } },
      { identifier: "reminder-stale", content: { data: {} } },
    ]);
    mockGetReminderScheduleLedger.mockReturnValue({
      version: 1,
      generatedAtMs: 1,
      normalNotifications: [
        {
          notificationId: firstId,
          habitId: "h1",
          habitTitle: "Old title",
          timestamp: firstTimestamp,
          reminderDate: "2026-03-21",
          reminderSeriesId: "series-h1-2026-03-21",
          attemptNumber: 0,
          maxAttempts: 1,
          signature: "stale-signature",
          scheduledAtMs: 1,
        },
      ],
    });

    await reconcileReminderNotifications({
      habits: { h1: makeHabit({ title: "New title" }) },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(firstId);
    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith("reminder-stale");
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: firstId,
        habitTitle: "New title",
      })
    );
  });

  it("cancels carried-forward interval reminders after completion and schedules the next interval occurrence", async () => {
    const staleCompletionDayTimestamp = dayjs("2026-03-24T09:00:00").valueOf();
    const staleNextDayTimestamp = dayjs("2026-03-25T09:00:00").valueOf();
    const nextIntervalTimestamp = dayjs("2026-03-27T09:00:00").valueOf();
    const staleCompletionDayId = `reminder-series-h1-2026-03-24-${staleCompletionDayTimestamp}`;
    const staleNextDayId = `reminder-series-h1-2026-03-25-${staleNextDayTimestamp}`;
    const nextIntervalId = `reminder-series-h1-2026-03-27-${nextIntervalTimestamp}`;

    mockGetAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: staleCompletionDayId, content: { data: {} } },
      { identifier: staleNextDayId, content: { data: {} } },
    ]);
    mockGetReminderScheduleLedger.mockReturnValue({
      version: 1,
      generatedAtMs: dayjs("2026-03-24T08:00:00").valueOf(),
      normalNotifications: [
        {
          notificationId: staleCompletionDayId,
          habitId: "h1",
          habitTitle: "Stretch",
          timestamp: staleCompletionDayTimestamp,
          reminderDate: "2026-03-24",
          reminderSeriesId: "series-h1-2026-03-24",
          attemptNumber: 0,
          maxAttempts: 1,
          signature: "old-carried-forward-completion-day",
          scheduledAtMs: dayjs("2026-03-24T08:00:00").valueOf(),
        },
        {
          notificationId: staleNextDayId,
          habitId: "h1",
          habitTitle: "Stretch",
          timestamp: staleNextDayTimestamp,
          reminderDate: "2026-03-25",
          reminderSeriesId: "series-h1-2026-03-25",
          attemptNumber: 0,
          maxAttempts: 1,
          signature: "old-carried-forward-next-day",
          scheduledAtMs: dayjs("2026-03-24T08:00:00").valueOf(),
        },
      ],
    });

    await reconcileReminderNotifications({
      habits: {
        h1: makeHabit({
          repetition: { type: RepetitionType.INTERVAL, days: 3 },
          completionHistory: {
            "2026-03-20": { isCompleted: true },
            "2026-03-24": { isCompleted: true },
          },
        }),
      },
      nowMs: dayjs("2026-03-24T08:00:00").valueOf(),
    });

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(staleCompletionDayId);
    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(staleNextDayId);
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: nextIntervalId,
        reminderDate: "2026-03-27",
        timestamp: nextIntervalTimestamp,
      })
    );
    expect(mockSchedulePreparedReminderNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ notificationId: staleCompletionDayId })
    );
    expect(mockSchedulePreparedReminderNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ notificationId: staleNextDayId })
    );
  });

  it("does not cancel unchanged valid scheduled reminders during foreground reconciliation", async () => {
    const firstTimestamp = dayjs("2026-03-21T09:00:00").valueOf();
    const firstId = `reminder-series-h1-2026-03-21-${firstTimestamp}`;
    const habit = makeHabit();

    await reconcileReminderNotifications({
      habits: { h1: habit },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    const savedLedger = mockSaveReminderScheduleLedger.mock.calls[0][0] as ReminderScheduleLedger;
    mockSaveReminderScheduleLedger.mockClear();
    mockSchedulePreparedReminderNotification.mockClear();
    mockGetAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: firstId, content: { data: {} } }]);
    mockGetReminderScheduleLedger.mockReturnValue({
      ...savedLedger,
      normalNotifications: [savedLedger.normalNotifications[0]],
      stopNotification: undefined,
    });

    await reconcileReminderNotifications({
      reason: "foreground",
      habits: { h1: habit },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalledWith(firstId);
    expect(mockSchedulePreparedReminderNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ notificationId: firstId })
    );
  });
});
