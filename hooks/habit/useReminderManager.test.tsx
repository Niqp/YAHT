import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import dayjs from "dayjs";

import { useReminderManager } from "@/hooks/habit/useReminderManager";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import { prepareReminderNotifications, schedulePreparedReminderNotification } from "@/utils/notifications";

let appStateListener: ((status: AppStateStatus) => void) | undefined;
const removeListener = jest.fn();

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

const makeDailyHabit = (overrides?: Partial<Habit["reminder"]>): Habit => ({
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
};

jest.mock("expo-notifications", () => ({
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  getPresentedNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/utils/notifications", () => ({
  prepareReminderNotifications: jest.fn(() => Promise.resolve(true)),
  schedulePreparedReminderNotification: jest.fn(() => Promise.resolve()),
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
      return { remove: removeListener } as never;
    });
    mockStoreState._hasHydrated = true;
    mockStoreState.habits = { h1: makeIntervalHabit() };
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
    expect(schedulePreparedReminderNotification).toHaveBeenCalledWith("h1", "Stretch", dayjs("2026-03-23T09:00:00").valueOf());
    expect(schedulePreparedReminderNotification).not.toHaveBeenCalledWith(
      "h1",
      "Stretch",
      dayjs("2026-03-22T09:00:00").valueOf()
    );
  });

  it("caps each scheduled reminder to 10 follow-up nags", async () => {
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
      expect(schedulePreparedReminderNotification).toHaveBeenCalledTimes(77);
    });

    expect(schedulePreparedReminderNotification).toHaveBeenCalledWith(
      "h1",
      "Stretch",
      dayjs("2026-03-22T09:50:00").valueOf()
    );
    expect(schedulePreparedReminderNotification).not.toHaveBeenCalledWith(
      "h1",
      "Stretch",
      dayjs("2026-03-22T09:55:00").valueOf()
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

  it("schedules reminders that are due exactly when the app backgrounds", async () => {
    mockStoreState.habits = {
      h1: makeDailyHabit(),
    };

    render(<TestComponent />);

    await act(async () => {
      appStateListener?.("background");
    });

    await waitFor(() => {
      expect(schedulePreparedReminderNotification).toHaveBeenCalledTimes(7);
    });

    const expectedTimestamp = dayjs().hour(9).minute(0).second(0).millisecond(0).valueOf();
    expect(schedulePreparedReminderNotification).toHaveBeenCalledWith("h1", "Stretch", expectedTimestamp);
  });

  it("skips scheduling when reminder preparation fails", async () => {
    (prepareReminderNotifications as jest.Mock).mockResolvedValue(false);

    render(<TestComponent />);

    await act(async () => {
      appStateListener?.("background");
    });

    await waitFor(() => {
      expect(prepareReminderNotifications).toHaveBeenCalled();
    });

    expect(schedulePreparedReminderNotification).not.toHaveBeenCalled();
  });
});
