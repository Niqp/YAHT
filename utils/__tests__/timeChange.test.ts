import { handleTimeChangeEvent } from "@/utils/timeChange";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

const mockReconcileActiveTimers = jest.fn();
const mockSetSelectedDate = jest.fn();
const mockGetCurrentTimeContext = jest.fn();

const mockStoreState = {
  _hasHydrated: true,
  selectedDate: "2026-03-20",
  reconcileActiveTimers: mockReconcileActiveTimers,
  setSelectedDate: mockSetSelectedDate,
};

jest.mock("@/store/habitStore", () => {
  const useHabitStore: any = {
    getState: () => mockStoreState,
    subscribe: jest.fn(),
  };
  return { useHabitStore };
});

jest.mock("@/utils/reminderScheduler", () => ({
  reconcileReminderNotifications: jest.fn(() => Promise.resolve()),
}));

jest.mock("@niqp/react-native-android-time-change", () => ({
  getCurrentTimeContext: () => mockGetCurrentTimeContext(),
}));

describe("handleTimeChangeEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-21T08:00:00.000Z"));
    mockStoreState._hasHydrated = true;
    mockStoreState.selectedDate = "2026-03-20";
    mockReconcileActiveTimers.mockResolvedValue(undefined);
    mockGetCurrentTimeContext.mockResolvedValue({
      timeZone: "Europe/Madrid",
      utcOffsetMinutes: 60,
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("reconciles timers, selected date, and reminder notifications after hydration", async () => {
    await handleTimeChangeEvent({
      action: "timezone_changed",
      timeZone: "Europe/Madrid",
      utcOffsetMinutes: 60,
      timestamp: Date.now(),
    });

    expect(mockReconcileActiveTimers).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedDate).toHaveBeenCalledWith("2026-03-21");
    expect(reconcileReminderNotifications).toHaveBeenCalledWith({
      reason: "time-change",
      timeZone: "Europe/Madrid",
      utcOffsetMinutes: 60,
    });
  });

  it("reuses the last native timezone for follow-up events without a timezone", async () => {
    await handleTimeChangeEvent({
      action: "timezone_changed",
      timeZone: "Europe/London",
      utcOffsetMinutes: 60,
      timestamp: Date.now(),
    });
    await handleTimeChangeEvent({
      action: "time_set",
      utcOffsetMinutes: 60,
      timestamp: Date.now(),
    });

    expect(reconcileReminderNotifications).toHaveBeenNthCalledWith(1, {
      reason: "time-change",
      timeZone: "Europe/London",
      utcOffsetMinutes: 60,
    });
    expect(reconcileReminderNotifications).toHaveBeenNthCalledWith(2, {
      reason: "time-change",
      timeZone: "Europe/London",
      utcOffsetMinutes: 60,
    });
    expect(mockGetCurrentTimeContext).not.toHaveBeenCalled();
  });
});
