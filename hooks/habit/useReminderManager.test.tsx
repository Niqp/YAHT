import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import dayjs from "dayjs";
import * as Notifications from "expo-notifications";
import { AppState, type AppStateStatus } from "react-native";

import { useReminderManager } from "@/hooks/habit/useReminderManager";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import {
  cancelReminderNotificationSeries,
  DEFAULT_REMINDER_SNOOZE_MS,
  getReminderNotificationSeriesId,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_OPEN_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
} from "@/utils/notifications";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

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
  habits: { h1: makeDailyHabit() } as Record<string, Habit>,
  updateHabit: mockUpdateHabit,
  updateCompletion: mockUpdateCompletion,
  setSelectedDate: mockSetSelectedDate,
};

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

const createNotificationResponse = (
  actionIdentifier: string,
  data:
    | ReminderNotificationResponseData
    | { kind: "reminderQueueStop"; scheduledFor: number; overflowTimestamp: number }
): Notifications.NotificationResponse => ({
  actionIdentifier,
  notification: {
    date: data.scheduledFor,
    request: {
      identifier:
        data.kind === "reminderQueueStop"
          ? "reminder-stop"
          : "reminder-series-" + data.habitId + "-" + data.reminderDate + "-090000",
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
  REMINDER_ACTION_DONE_IDENTIFIER: "habitReminderDone",
  REMINDER_ACTION_SNOOZE_IDENTIFIER: "habitReminderSnooze",
  REMINDER_ACTION_OPEN_IDENTIFIER: "habitReminderOpen",
  getReminderNotificationSeriesId: jest.fn(
    (habitId: string, reminderDate: string) => `series-${habitId}-${reminderDate}`
  ),
  getReminderNotificationData: jest.fn((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    return data?.kind === "habitReminder" ? data : undefined;
  }),
  getReminderQueueStopNotificationData: jest.fn((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    return data?.kind === "reminderQueueStop" ? data : undefined;
  }),
  cancelReminderNotificationSeries: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/utils/reminderScheduler", () => ({
  reconcileReminderNotifications: jest.fn(() => Promise.resolve()),
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
    mockStoreState.habits = { h1: makeDailyHabit() };
    mockGetLastNotificationResponse.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("reconciles from habit state after hydration", async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(reconcileReminderNotifications).toHaveBeenCalledWith({
        reason: "habit-change",
        habits: mockStoreState.habits,
      });
    });
  });

  it("reconciles on background and foreground transitions", async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(reconcileReminderNotifications).toHaveBeenCalled();
    });
    jest.mocked(reconcileReminderNotifications).mockClear();

    await act(async () => {
      appStateListener?.("background");
    });
    await act(async () => {
      appStateListener?.("active");
    });

    await waitFor(() => {
      expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "background" });
      expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "foreground" });
    });
  });

  it("snoozes a reminder series when the snooze action is tapped", async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(reconcileReminderNotifications).toHaveBeenCalled();
    });
    jest.mocked(reconcileReminderNotifications).mockClear();

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
    expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "notification-response" });
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

  it("opens today and selects the reminder date when a reminder is opened", async () => {
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

  it("opens today and reconciles when the stop notification is tapped", async () => {
    render(<TestComponent />);

    await act(async () => {
      notificationResponseListener?.(
        createNotificationResponse(Notifications.DEFAULT_ACTION_IDENTIFIER, {
          kind: "reminderQueueStop",
          scheduledFor: dayjs("2026-03-21T09:00:00").valueOf(),
          overflowTimestamp: dayjs("2026-03-21T09:00:00").valueOf(),
        })
      );
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/(tabs)/today");
      expect(reconcileReminderNotifications).toHaveBeenCalledWith({ reason: "notification-response" });
    });
  });
});
