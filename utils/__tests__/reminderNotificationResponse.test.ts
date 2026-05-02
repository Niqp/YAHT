import * as Notifications from "expo-notifications";

import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import {
  DEFAULT_REMINDER_SNOOZE_MS,
  getReminderNotificationSeriesId,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_OPEN_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
} from "@/utils/notifications";
import { handleReminderNotificationResponse } from "@/utils/reminderNotificationResponse";
import { setReminderResponseLedgerStorageForTests } from "@/utils/reminderResponseLedger";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

const mockCancelReminderNotificationSeries = jest.fn();
const mockClearLastNotificationResponse = jest.fn();
const mockSchedulePreparedReminderNotification = jest.fn();
const mockRemoveReminderScheduleLedgerEntriesForSeries = jest.fn();
const mockReplaceReminderScheduleLedgerEntriesForSeries = jest.fn();
const mockUpdateHabit = jest.fn();
const mockUpdateCompletion = jest.fn();

jest.mock("expo-notifications", () => ({
  __esModule: true,
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
  clearLastNotificationResponse: (...args: unknown[]) => mockClearLastNotificationResponse(...args),
}));

jest.mock("@/utils/reminderScheduler", () => ({
  reconcileReminderNotifications: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/utils/notifications", () => {
  return {
    DEFAULT_REMINDER_SNOOZE_MS: 15 * 60 * 1000,
    MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE: 3,
    REMINDER_ACTION_DONE_IDENTIFIER: "habitReminderDone",
    REMINDER_ACTION_SNOOZE_IDENTIFIER: "habitReminderSnooze",
    REMINDER_ACTION_OPEN_IDENTIFIER: "habitReminderOpen",
    getReminderNotificationSeriesId: (habitId: string, reminderDate: string) => `series-${habitId}-${reminderDate}`,
    getReminderNotificationData: (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      return data?.kind === "habitReminder" ? data : undefined;
    },
    getReminderQueueStopNotificationData: (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      return data?.kind === "reminderQueueStop" ? data : undefined;
    },
    cancelReminderNotificationSeries: (...args: unknown[]) => mockCancelReminderNotificationSeries(...args),
    schedulePreparedReminderNotification: (...args: unknown[]) => mockSchedulePreparedReminderNotification(...args),
  };
});

jest.mock("@/utils/reminderScheduleLedger", () => ({
  removeReminderScheduleLedgerEntriesForSeries: (...args: unknown[]) =>
    mockRemoveReminderScheduleLedgerEntriesForSeries(...args),
  replaceReminderScheduleLedgerEntriesForSeries: (...args: unknown[]) =>
    mockReplaceReminderScheduleLedgerEntriesForSeries(...args),
}));

const mockStoreState = {
  habits: {} as Record<string, Habit>,
  updateHabit: mockUpdateHabit,
  updateCompletion: mockUpdateCompletion,
};

jest.mock("@/store/habitStore", () => ({
  useHabitStore: {
    getState: () => mockStoreState,
  },
}));

type ReminderNotificationResponseData = {
  kind: "habitReminder";
  habitId: string;
  habitTitle: string;
  reminderDate: string;
  reminderSeriesId: string;
  scheduledFor: number;
  attemptNumber: number;
  maxAttempts: number;
  repeatIntervalMs?: number;
};

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

const makeReminderData = (
  overrides: Partial<ReminderNotificationResponseData> = {}
): ReminderNotificationResponseData => ({
  kind: "habitReminder",
  habitId: "h1",
  habitTitle: "Stretch",
  reminderDate: "2026-03-21",
  reminderSeriesId: getReminderNotificationSeriesId("h1", "2026-03-21"),
  scheduledFor: 123_000,
  attemptNumber: 0,
  maxAttempts: 4,
  ...overrides,
});

const createNotificationResponse = (
  actionIdentifier: string,
  data:
    | ReminderNotificationResponseData
    | { kind: "reminderQueueStop"; scheduledFor: number; overflowTimestamp: number },
  identifier = data.kind === "reminderQueueStop" ? "reminder-stop" : `reminder-${data.kind}-${data.scheduledFor}`
): Notifications.NotificationResponse => ({
  actionIdentifier,
  notification: {
    date: data.scheduledFor,
    request: {
      identifier,
      content: {
        title: data.kind,
        subtitle: null,
        body: null,
        data,
        categoryIdentifier: null,
        sound: null,
        launchImageName: null,
        badge: null,
        attachments: [],
        threadIdentifier: null,
      },
      trigger: null,
    },
  },
});

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
};

describe("handleReminderNotificationResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setReminderResponseLedgerStorageForTests(createStorage());
    mockCancelReminderNotificationSeries.mockResolvedValue(undefined);
    mockSchedulePreparedReminderNotification.mockImplementation((job) =>
      Promise.resolve(`reminder-${job.reminderSeriesId}-${job.timestamp}`)
    );
    mockUpdateHabit.mockResolvedValue(undefined);
    mockUpdateCompletion.mockResolvedValue(undefined);
    mockStoreState.habits = { h1: makeHabit() };
  });

  afterEach(() => {
    setReminderResponseLedgerStorageForTests(undefined);
  });

  it("completes a simple habit once when Done is tapped", async () => {
    const response = createNotificationResponse(
      REMINDER_ACTION_DONE_IDENTIFIER,
      makeReminderData(),
      "reminder-h1-done"
    );

    await expect(handleReminderNotificationResponse(response, { nowMs: 1_000 })).resolves.toEqual({
      handled: true,
      shouldNavigateToToday: false,
      selectedDate: undefined,
    });
    await handleReminderNotificationResponse(response, { nowMs: 2_000 });

    expect(mockCancelReminderNotificationSeries).toHaveBeenCalledTimes(1);
    expect(mockUpdateCompletion).toHaveBeenCalledTimes(1);
    expect(mockUpdateCompletion).toHaveBeenCalledWith({ id: "h1", date: "2026-03-21" });
    expect(reconcileReminderNotifications).toHaveBeenCalledTimes(1);
    expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "notification-response" });
  });

  it("completes repetition and timed habits to their goal", async () => {
    mockStoreState.habits = {
      h1: makeHabit({
        completion: { type: CompletionType.REPETITIONS, goal: 12 },
      }),
      h2: makeHabit({
        id: "h2",
        completion: { type: CompletionType.TIMED, goal: 60_000 },
      }),
    };

    await handleReminderNotificationResponse(
      createNotificationResponse(
        REMINDER_ACTION_DONE_IDENTIFIER,
        makeReminderData({ habitId: "h1", reminderSeriesId: "series-h1" }),
        "reminder-h1-done"
      ),
      { nowMs: 1_000 }
    );
    await handleReminderNotificationResponse(
      createNotificationResponse(
        REMINDER_ACTION_DONE_IDENTIFIER,
        makeReminderData({ habitId: "h2", reminderSeriesId: "series-h2" }),
        "reminder-h2-done"
      ),
      { nowMs: 2_000 }
    );

    expect(mockUpdateCompletion).toHaveBeenCalledWith({ id: "h1", date: "2026-03-21", value: 12 });
    expect(mockUpdateCompletion).toHaveBeenCalledWith({ id: "h2", date: "2026-03-21", value: 60_000 });
  });

  it("snoozes once and does not extend duplicate snoozes", async () => {
    const response = createNotificationResponse(
      REMINDER_ACTION_SNOOZE_IDENTIFIER,
      makeReminderData({ repeatIntervalMs: 300_000 }),
      "reminder-h1-snooze"
    );

    await handleReminderNotificationResponse(response, { nowMs: 1_000 });
    await handleReminderNotificationResponse(response, { nowMs: 2_000 });

    expect(mockUpdateHabit).toHaveBeenCalledTimes(1);
    expect(mockUpdateHabit).toHaveBeenCalledWith(
      "h1",
      expect.objectContaining({
        reminder: expect.objectContaining({
          snoozedDate: "2026-03-21",
          snoozedUntilMs: 1_000 + DEFAULT_REMINDER_SNOOZE_MS,
        }),
      })
    );
    expect(reconcileReminderNotifications).toHaveBeenCalledTimes(1);
  });

  it("uses targeted background completion for snooze without full reconciliation", async () => {
    const response = createNotificationResponse(
      REMINDER_ACTION_SNOOZE_IDENTIFIER,
      makeReminderData({ maxAttempts: 4, repeatIntervalMs: 300_000 }),
      "reminder-h1-snooze"
    );

    await handleReminderNotificationResponse(response, {
      nowMs: 1_000,
      completionMode: "targeted-background",
    });

    expect(mockCancelReminderNotificationSeries).toHaveBeenCalledWith("series-h1-2026-03-21");
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledTimes(4);
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        habitId: "h1",
        habitTitle: "Stretch",
        timestamp: 1_000 + DEFAULT_REMINDER_SNOOZE_MS,
        reminderDate: "2026-03-21",
        reminderSeriesId: "series-h1-2026-03-21",
        attemptNumber: 0,
        maxAttempts: 4,
        repeatIntervalMs: 300_000,
      })
    );
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: 1_000 + DEFAULT_REMINDER_SNOOZE_MS + 900_000,
        attemptNumber: 3,
      })
    );
    expect(mockReplaceReminderScheduleLedgerEntriesForSeries).toHaveBeenCalledWith(
      "series-h1-2026-03-21",
      expect.arrayContaining([
        expect.objectContaining({
          notificationId: `reminder-series-h1-2026-03-21-${1_000 + DEFAULT_REMINDER_SNOOZE_MS}`,
          attemptNumber: 0,
        }),
        expect.objectContaining({
          notificationId: `reminder-series-h1-2026-03-21-${1_000 + DEFAULT_REMINDER_SNOOZE_MS + 900_000}`,
          attemptNumber: 3,
        }),
      ])
    );
    expect(reconcileReminderNotifications).not.toHaveBeenCalled();
  });

  it("uses targeted background completion for Done without full reconciliation", async () => {
    await handleReminderNotificationResponse(
      createNotificationResponse(REMINDER_ACTION_DONE_IDENTIFIER, makeReminderData(), "reminder-h1-done"),
      {
        nowMs: 1_000,
        completionMode: "targeted-background",
      }
    );

    expect(mockUpdateCompletion).toHaveBeenCalledWith({ id: "h1", date: "2026-03-21" });
    expect(mockRemoveReminderScheduleLedgerEntriesForSeries).toHaveBeenCalledWith("series-h1-2026-03-21");
    expect(reconcileReminderNotifications).not.toHaveBeenCalled();
  });

  it("schedules the next interval reminder series for targeted background Done without full reconciliation", async () => {
    mockStoreState.habits = {
      h1: makeHabit({
        repetition: { type: RepetitionType.INTERVAL, days: 3 },
        reminder: {
          enabled: true,
          hour: 9,
          minute: 30,
          repeatIfNotCompleted: true,
          repeatIntervalMs: 600_000,
        },
      }),
    };

    await handleReminderNotificationResponse(
      createNotificationResponse(REMINDER_ACTION_DONE_IDENTIFIER, makeReminderData(), "reminder-h1-done"),
      {
        nowMs: 1_000,
        completionMode: "targeted-background",
      }
    );

    expect(mockUpdateCompletion).toHaveBeenCalledWith({ id: "h1", date: "2026-03-21" });
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledTimes(4);
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        habitId: "h1",
        habitTitle: "Stretch",
        timestamp: new Date("2026-03-24T09:30:00").getTime(),
        reminderDate: "2026-03-24",
        reminderSeriesId: "series-h1-2026-03-24",
        attemptNumber: 0,
        maxAttempts: 4,
        repeatIntervalMs: 600_000,
      })
    );
    expect(mockSchedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: new Date("2026-03-24T09:30:00").getTime() + 1_800_000,
        attemptNumber: 3,
      })
    );
    expect(mockReplaceReminderScheduleLedgerEntriesForSeries).toHaveBeenCalledWith(
      "series-h1-2026-03-24",
      expect.arrayContaining([
        expect.objectContaining({
          notificationId: `reminder-series-h1-2026-03-24-${new Date("2026-03-24T09:30:00").getTime()}`,
          attemptNumber: 0,
        }),
        expect.objectContaining({
          notificationId: `reminder-series-h1-2026-03-24-${new Date("2026-03-24T09:30:00").getTime() + 1_800_000}`,
          attemptNumber: 3,
        }),
      ])
    );
    expect(reconcileReminderNotifications).not.toHaveBeenCalled();
  });

  it("does not schedule a targeted snooze when the habit is missing", async () => {
    mockStoreState.habits = {};

    await handleReminderNotificationResponse(
      createNotificationResponse(REMINDER_ACTION_SNOOZE_IDENTIFIER, makeReminderData(), "reminder-missing-snooze"),
      {
        nowMs: 1_000,
        completionMode: "targeted-background",
      }
    );

    expect(mockSchedulePreparedReminderNotification).not.toHaveBeenCalled();
    expect(mockReplaceReminderScheduleLedgerEntriesForSeries).not.toHaveBeenCalled();
    expect(reconcileReminderNotifications).not.toHaveBeenCalled();
  });

  it("requests navigation and reconciles for stop notifications", async () => {
    const result = await handleReminderNotificationResponse(
      createNotificationResponse(Notifications.DEFAULT_ACTION_IDENTIFIER, {
        kind: "reminderQueueStop",
        scheduledFor: 123_000,
        overflowTimestamp: 456_000,
      }),
      { nowMs: 1_000 }
    );

    expect(result).toEqual({ handled: true, shouldNavigateToToday: true });
    expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "notification-response" });
  });

  it("requests navigation and selected date for open/default reminder taps", async () => {
    const result = await handleReminderNotificationResponse(
      createNotificationResponse(REMINDER_ACTION_OPEN_IDENTIFIER, makeReminderData(), "reminder-h1-open"),
      { nowMs: 1_000 }
    );

    expect(result).toEqual({
      handled: true,
      shouldNavigateToToday: true,
      selectedDate: "2026-03-21",
    });
    expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "notification-response" });
  });

  it("no-ops for missing habit data", async () => {
    const result = await handleReminderNotificationResponse(
      createNotificationResponse(REMINDER_ACTION_DONE_IDENTIFIER, makeReminderData({ habitId: "missing" })),
      { nowMs: 1_000 }
    );

    expect(result.handled).toBe(true);
    expect(mockUpdateCompletion).not.toHaveBeenCalled();
    expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "notification-response" });
  });
});
