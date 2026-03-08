import React from "react";
import { render, act } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";
import { useTimerManager } from "@/hooks/timer/useTimerManager";
import { cancelAllTimerNotifications, scheduleTimerNotification } from "@/utils/notifications";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";

let appStateListener: ((status: AppStateStatus) => void) | undefined;
const removeListener = jest.fn();

const makeHabit = (id: string): Habit => ({
  id,
  title: `Habit ${id}`,
  icon: "*",
  repetition: { type: RepetitionType.DAILY },
  completion: { type: CompletionType.TIMED, goal: 5_000 },
  completionHistory: {
    "2026-02-16": { isCompleted: false, value: 1_000 },
  },
  createdAt: "2026-01-01",
});

const mockStoreState = {
  _hasHydrated: true,
  habits: { h1: makeHabit("h1") },
  activeTimers: {} as Record<string, Record<string, { id: string; lastResumedAt: string | null }>>,
  tickForeground: jest.fn(),
  reconcileActiveTimers: jest.fn(() => Promise.resolve()),
};

jest.mock("@/utils/notifications", () => ({
  cancelAllTimerNotifications: jest.fn(() => Promise.resolve()),
  scheduleTimerNotification: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/store/habitStore", () => {
  const useHabitStore: any = (stateSelector: any) => stateSelector(mockStoreState);
  useHabitStore.getState = () => mockStoreState;
  return { useHabitStore };
});

function TestComponent() {
  useTimerManager();
  return null;
}

describe("useTimerManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-02-16T10:00:00.000Z").valueOf());
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "active",
    });
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      appStateListener = listener;
      return { remove: removeListener } as never;
    });
    mockStoreState._hasHydrated = true;
    mockStoreState.habits = { h1: makeHabit("h1") };
    mockStoreState.activeTimers = {};
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("runs cold launch reconciliation once", () => {
    render(<TestComponent />);
    expect(mockStoreState.reconcileActiveTimers).toHaveBeenCalledTimes(1);
    expect(cancelAllTimerNotifications).toHaveBeenCalledTimes(2);
  });

  it("reconciles when app returns to active", () => {
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "background",
    });
    render(<TestComponent />);

    act(() => {
      appStateListener?.("active");
    });

    expect(mockStoreState.reconcileActiveTimers).toHaveBeenCalledTimes(2);
    expect(cancelAllTimerNotifications).toHaveBeenCalledTimes(3);
  });

  it("starts foreground ticking when active timers exist", () => {
    mockStoreState.activeTimers = {
      h1: {
        "2026-02-16": { id: "timer-1", lastResumedAt: "2026-02-16T09:00:00.000Z" },
      },
    };

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockStoreState.tickForeground).toHaveBeenCalled();
  });

  it("cancels all notifications when no active timers exist", () => {
    render(<TestComponent />);
    expect(cancelAllTimerNotifications).toHaveBeenCalledTimes(2);
  });

  it("schedules background timer notifications when the app leaves foreground", async () => {
    mockStoreState.activeTimers = {
      h1: {
        "2026-02-16": { id: "timer-1", lastResumedAt: "2026-02-16T09:59:58.000Z" },
      },
    };

    render(<TestComponent />);

    await act(async () => {
      appStateListener?.("background");
    });

    expect(scheduleTimerNotification).toHaveBeenCalledWith("timer-1", "Habit h1", 2_000);
  });

  it("does best-effort reconcile on unmount", () => {
    const view = render(<TestComponent />);
    view.unmount();

    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(mockStoreState.reconcileActiveTimers).toHaveBeenCalledTimes(2);
    expect(cancelAllTimerNotifications).toHaveBeenCalledTimes(3);
  });
});
