import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  cancelAllTimerNotifications,
  cancelTimerNotification,
  prepareTimerNotifications,
  scheduleTimerNotification,
} from "@/utils/notifications";

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockDismissNotificationAsync = jest.fn();
const mockCancelAllScheduledNotificationsAsync = jest.fn();
const mockDismissAllNotificationsAsync = jest.fn();

jest.mock("expo-notifications", () => ({
  __esModule: true,
  AndroidImportance: { MAX: "max" },
  AndroidNotificationPriority: { MAX: "max" },
  SchedulableTriggerInputTypes: { DATE: "date" },
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduledNotificationAsync(...args),
  dismissNotificationAsync: (...args: unknown[]) => mockDismissNotificationAsync(...args),
  cancelAllScheduledNotificationsAsync: (...args: unknown[]) => mockCancelAllScheduledNotificationsAsync(...args),
  dismissAllNotificationsAsync: (...args: unknown[]) => mockDismissAllNotificationsAsync(...args),
}));

const mockCanScheduleExactAlarms = jest.fn();
const mockOpenSettings = jest.fn();

jest.mock("react-native-permissions", () => ({
  __esModule: true,
  canScheduleExactAlarms: (...args: unknown[]) => mockCanScheduleExactAlarms(...args),
  openSettings: (...args: unknown[]) => mockOpenSettings(...args),
}));

jest.mock("react-native", () => ({
  Platform: {
    OS: "android",
    select: (obj: Record<string, unknown>) => obj.android ?? obj.default,
  },
}));

describe("prepareTimerNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    mockSetNotificationChannelAsync.mockResolvedValue(undefined);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
  });

  it("returns true when notification and exact alarm access are available", async () => {
    await expect(prepareTimerNotifications()).resolves.toBe(true);
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith("timers", {
      name: "Timers",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    expect(mockCanScheduleExactAlarms).toHaveBeenCalledTimes(1);
  });

  it("requests notification permissions when needed", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ granted: false });

    await prepareTimerNotifications();

    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("opens exact alarm settings when requested and unavailable", async () => {
    mockCanScheduleExactAlarms.mockResolvedValue(false);

    await expect(prepareTimerNotifications()).resolves.toBe(false);
    expect(mockOpenSettings).toHaveBeenCalledWith("alarms");
  });

  it("does not open alarm settings when disabled by caller", async () => {
    mockCanScheduleExactAlarms.mockResolvedValue(false);

    await expect(prepareTimerNotifications({ openAlarmSettings: false })).resolves.toBe(false);
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });
});

describe("scheduleTimerNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockSetNotificationChannelAsync.mockResolvedValue(undefined);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    mockScheduleNotificationAsync.mockResolvedValue("timer-timer-1");
    jest.spyOn(Date, "now").mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("schedules a date-based timer notification with a stable identifier", async () => {
    const result = await scheduleTimerNotification("timer-1", "Deep Work", 5_000);

    expect(result).toBe("timer-timer-1");
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: "timer-timer-1",
      content: {
        title: "Timer Reached its goal!",
        body: "Deep Work timer has reached its goal, but is still running.",
        sound: "default",
        color: "#023c69",
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(6_000),
        channelId: "timers",
      },
    });
  });

  it("uses an immediate trigger when the timer has no remaining time", async () => {
    await scheduleTimerNotification("timer-1", "Deep Work", 0);

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: "timer-timer-1",
      content: {
        title: "Timer Reached its goal!",
        body: "Deep Work timer has reached its goal, but is still running.",
        sound: "default",
        color: "#023c69",
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  });

  it("returns undefined when exact alarms are unavailable", async () => {
    mockCanScheduleExactAlarms.mockResolvedValue(false);

    await expect(scheduleTimerNotification("timer-1", "Deep Work", 5_000)).resolves.toBeUndefined();
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("skips exact alarm checks on iOS", async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "ios" });

    await scheduleTimerNotification("timer-1", "Deep Work", 5_000);

    expect(mockCanScheduleExactAlarms).not.toHaveBeenCalled();
    Object.defineProperty(Platform, "OS", { value: originalPlatform });
  });
});

describe("timer notification cancellation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("cancels and dismisses a single timer notification", async () => {
    await cancelTimerNotification("timer-1");

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith("timer-timer-1");
    expect(mockDismissNotificationAsync).toHaveBeenCalledWith("timer-timer-1");
  });

  it("cancels and dismisses all timer notifications", async () => {
    await cancelAllTimerNotifications();

    expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(mockDismissAllNotificationsAsync).toHaveBeenCalledTimes(1);
  });
});
