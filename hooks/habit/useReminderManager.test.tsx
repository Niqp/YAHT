import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import dayjs from "dayjs";

import { useReminderManager } from "@/hooks/habit/useReminderManager";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import { scheduleReminderNotification } from "@/utils/notifications";

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
  scheduleReminderNotification: jest.fn(() => Promise.resolve()),
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
      return { remove: removeListener } as never;
    });
    mockStoreState._hasHydrated = true;
    mockStoreState.habits = { h1: makeIntervalHabit() };
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
      expect(scheduleReminderNotification).toHaveBeenCalled();
    });

    expect(scheduleReminderNotification).toHaveBeenCalledWith(
      "h1",
      "Stretch",
      dayjs("2026-03-23T09:00:00").valueOf()
    );
    expect(scheduleReminderNotification).not.toHaveBeenCalledWith(
      "h1",
      "Stretch",
      dayjs("2026-03-22T09:00:00").valueOf()
    );
  });
});
