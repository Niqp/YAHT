import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import dayjs from "dayjs";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { AppState, type AppStateStatus } from "react-native";

import { useReminderManager } from "@/hooks/habit/useReminderManager";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import {
  cancelReminderNotificationSeries,
  clearReminderNotifications,
  DEFAULT_REMINDER_SNOOZE_MS,
  getReminderNotificationSeriesId,
  prepareReminderNotifications,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_OPEN_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
  schedulePreparedReminderNotification,
} from "@/utils/notifications";

let appStateListener: ((status: AppStateStatus) => void) | undefined;
let notificationResponseListener: ((response: Notifications.NotificationResponse) => void) | undefined;
const removeAppStateListener = jest.fn();
const mockRemoveNotificationListener = jest.fn();
const mockRouterReplace = jest.fn();
const mockClearLastNotificationResponse = jest.fn();
const mockGetLastNotificationResponse = jest.fn();
const mockUpdateHabit = jest.fn();
const mockUpdateCompletion = jest.fn();
const mockSetSelectedDate = jest.fn();

const makeIntervalHabit = (): Habit => ({
  id: "h1",
  title: "Stretch",
  icon: "*",
  repetition: { type: RepetitionType.INTERVAL, days: 3 },
  completion: { type: CompletionType.SIMPLE },
  completionHistory: {
    "2026-03-20": { isCompleted: true },
  },
  createdAt: "2026-03-19",
  reminder: {
    enabled: true,
    hour: 9,
    minute: 0,
    repeatIfNotCompleted: false,
  },
});

const makeDailyHabit = (overrides?: Partial<NonNullable<Habit["reminder"]>>): Habit => ({
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
    ...overrides,
  },
});

const mockStoreState = {
  _hasHydrated: true,
  habits: { h1: makeIntervalHabit() } as Record<string, Habit>,
  updateHabit: mockUpdateHabit,
  updateCompletion: mockUpdateCompletion,
  setSelectedDate: mockSetSelectedDate,
};

type ReminderNotificationResponseData = {
  kind: string;
  habitId: string;
  habitTitle: string;
  reminderDate: string;
  reminderSeriesId: string;
  scheduledFor: number;
  attemptNumber: number;
  maxAttempts: number;
  repeatIntervalMs?: number;
};

const createNotificationResponse = (
  actionIdentifier: string,
  data: ReminderNotificationResponseData
): Notifications.NotificationResponse => ({
  actionIdentifier,
  notification: {
    date: data.scheduledFor,
    request: {
      identifier: "reminder-series-" + data.habitId + "-" + data.reminderDate + "-090000",
      content: {
        title: data.habitTitle,
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

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}));

jest.mock("expo-notifications", () => ({
  __esModule: true,
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
  getLastNotificationResponse: (...args: unknown[]) => mockGetLastNotificationResponse(...args),
  clearLastNotificationResponse: (...args: unknown[]) => mockClearLastNotificationResponse(...args),
  addNotificationResponseReceivedListener: (listener: (response: Notifications.NotificationResponse) => void) => {
    notificationResponseListener = listener;
    return { remove: mockRemoveNotificationListener };
  },
}));

jest.mock("@/utils/notifications", () => ({
  DEFAULT_REMINDER_SNOOZE_MS: 15 * 60 * 1000,
  MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE: 3,
  REMINDER_ACTION_DONE_IDENTIFIER: "habitReminderDone",
  REMINDER_ACTION_SNOOZE_IDENTIFIER: "habitReminderSnooze",
  REMINDER_ACTION_OPEN_IDENTIFIER: "habitReminderOpen",
  getReminderNotificationSeriesId: jest.fn(
    (habitId: string, reminderDate: string) => `series-${habitId}-${reminderDate}`
  ),
  getReminderNotificationData: jest.fn(
    (response: Notifications.NotificationResponse) => response.notification.request.content.data
  ),
  prepareReminderNotifications: jest.fn(() => Promise.resolve(true)),
  schedulePreparedReminderNotification: jest.fn(() => Promise.resolve()),
  clearReminderNotifications: jest.fn(() => Promise.resolve()),
  cancelReminderNotificationSeries: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/store/habitStore", () => {
  const useHabitStore: any = (selector: any) => selector(mockStoreState);
  useHabitStore.getState = () => mockStoreState;
  return { useHabitStore };
});

function TestComponent() {
  useReminderManager();
  return null;
}

describe("useReminderManager", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-21T08:00:00.000Z"));
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "active",
    });
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      appStateListener = listener;
      return { remove: removeAppStateListener } as never;
    });
    mockStoreState._hasHydrated = true;
    mockStoreState.habits = { h1: makeIntervalHabit() };
    mockGetLastNotificationResponse.mockReturnValue(null);
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("anchors interval reminders to the last completion date", async () => {
    render(<TestComponent />);

    await act(async () => {
      appStateListener?.("background");
    });

    await waitFor(() => {
      expect(schedulePreparedReminderNotification).toHaveBeenCalled();
    });

    expect(prepareReminderNotifications).toHaveBeenCalledTimes(1);
    expect(schedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        habitId: "h1",
        habitTitle: "Stretch",
        reminderDate: "2026-03-23",
        timestamp: dayjs("2026-03-23T09:00:00").valueOf(),
        attemptNumber: 0,
        maxAttempts: 1,
      })
    );
    expect(schedulePreparedReminderNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({
        reminderDate: "2026-03-22",
        timestamp: dayjs("2026-03-22T09:00:00").valueOf(),
      })
    );
  });

  it("caps each scheduled reminder to three follow-up nags per day", async () => {
    mockStoreState.habits = {
      h1: makeDailyHabit({
        repeatIfNotCompleted: true,
        repeatIntervalMs: 5 * 60 * 1000,
      }),
    };

    render(<TestComponent />);

    await act(async () => {
      appStateListener?.("background");
    });

    await waitFor(() => {
      expect(schedulePreparedReminderNotification).toHaveBeenCalledTimes(28);
    });

    expect(schedulePreparedReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderDate: "2026-03-22",
        timestamp: dayjs("2026-03-22T09:15:00").valueOf(),
        attemptNumber: 3,
        maxAttempts: 4,
      })
    );
    expect(schedulePreparedReminderNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({
        reminderDate: "2026-03-22",
        timestamp: dayjs("2026-03-22T09:20:00").valueOf(),
      })
    );
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining("Scheduling the earliest 500"));
  });

  it("skips repeating nags when repeatIntervalMs is invalid instead of looping", async () => {
    mockStoreState.habits = {
      h1: makeDailyHabit({
        repeatIfNotCompleted: true,
        repeatIntervalMs: 0,
      }),
    };

    render(<TestComponent />);

    await act(async () => {
      appStateListener?.("background");
    });

    await waitFor(() => {
      expect(schedulePreparedReminderNotification).toHaveBeenCalledTimes(7);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Skipping repeating reminder nags for habit "Stretch"')
    );
  });

  it("snoozes a reminder series when the snooze action is tapped", async () => {
    render(<TestComponent />);

    await act(async () => {
      notificationResponseListener?.(
        createNotificationResponse(REMINDER_ACTION_SNOOZE_IDENTIFIER, {
          kind: "habitReminder",
          habitId: "h1",
          habitTitle: "Stretch",
          reminderDate: "2026-03-21",
          reminderSeriesId: getReminderNotificationSeriesId("h1", "2026-03-21"),
          scheduledFor: dayjs("2026-03-21T09:00:00").valueOf(),
          attemptNumber: 0,
          maxAttempts: 4,
          repeatIntervalMs: 300_000,
        })
      );
    });

    await waitFor(() => {
      expect(cancelReminderNotificationSeries).toHaveBeenCalledWith(
        getReminderNotificationSeriesId("h1", "2026-03-21")
      );
    });

    expect(mockUpdateHabit).toHaveBeenCalledWith(
      "h1",
      expect.objectContaining({
        reminder: expect.objectContaining({
          snoozedDate: "2026-03-21",
          snoozedUntilMs: dayjs().add(DEFAULT_REMINDER_SNOOZE_MS, "ms").valueOf(),
        }),
      })
    );
    expect(mockUpdateCompletion).not.toHaveBeenCalled();
    expect(mockClearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  it("completes the habit when the done action is tapped", async () => {
    render(<TestComponent />);

    await act(async () => {
      notificationResponseListener?.(
        createNotificationResponse(REMINDER_ACTION_DONE_IDENTIFIER, {
          kind: "habitReminder",
          habitId: "h1",
          habitTitle: "Stretch",
          reminderDate: "2026-03-21",
          reminderSeriesId: getReminderNotificationSeriesId("h1", "2026-03-21"),
          scheduledFor: dayjs("2026-03-21T09:00:00").valueOf(),
          attemptNumber: 0,
          maxAttempts: 4,
        })
      );
    });

    await waitFor(() => {
      expect(mockUpdateCompletion).toHaveBeenCalledWith({ id: "h1", date: "2026-03-21" });
    });
  });

  it("opens today and selects the reminder date when the notification is opened", async () => {
    render(<TestComponent />);

    await act(async () => {
      notificationResponseListener?.(
        createNotificationResponse(REMINDER_ACTION_OPEN_IDENTIFIER, {
          kind: "habitReminder",
          habitId: "h1",
          habitTitle: "Stretch",
          reminderDate: "2026-03-21",
          reminderSeriesId: getReminderNotificationSeriesId("h1", "2026-03-21"),
          scheduledFor: dayjs("2026-03-21T09:00:00").valueOf(),
          attemptNumber: 0,
          maxAttempts: 4,
        })
      );
    });

    await waitFor(() => {
      expect(mockSetSelectedDate).toHaveBeenCalledWith("2026-03-21");
    });
    expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/today");
  });
});
