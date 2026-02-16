import React from "react";
import { render, act } from "@testing-library/react-native";
import { AppState, AppStateStatus } from "react-native";
import { useTimerManager } from "@/hooks/timer/useTimerManager";
import { cancelAllNotifications } from "@/utils/notifications";

let appStateListener: ((status: AppStateStatus) => void) | undefined;
const removeListener = jest.fn();

const mockStoreState = {
  activeTimers: {} as Record<string, Record<string, { id: string; lastResumedAt: string | null }>>,
  tickForeground: jest.fn(),
  reconcileActiveTimers: jest.fn(() => Promise.resolve()),
};

jest.mock("@/utils/notifications", () => ({
  cancelAllNotifications: jest.fn(),
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
    Object.defineProperty(AppState, "currentState", {
      configurable: true,
      value: "active",
    });
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      appStateListener = listener;
      return { remove: removeListener } as never;
    });
    mockStoreState.activeTimers = {};
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs cold launch reconciliation once", () => {
    render(<TestComponent />);
    expect(mockStoreState.reconcileActiveTimers).toHaveBeenCalledTimes(1);
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
    expect(cancelAllNotifications).toHaveBeenCalledTimes(1);
  });

  it("does best-effort reconcile on unmount", () => {
    const view = render(<TestComponent />);
    view.unmount();

    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(mockStoreState.reconcileActiveTimers).toHaveBeenCalledTimes(2);
  });
});
