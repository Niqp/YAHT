import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  cancelAllTimerNotifications,
  cancelReminderNotificationSeries,
  cancelTimerNotification,
  clearReminderNotifications,
  getReminderNotificationSeriesId,
  prepareReminderNotifications,
  prepareTimerNotifications,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_OPEN_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
  schedulePreparedReminderNotification,
  scheduleReminderNotification,
  scheduleTimerNotification,
} from "@/utils/notifications";
import { clearDiagnosticEvents, getDiagnosticEvents } from "@/utils/diagnostics/diagnosticLogger";

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockSetNotificationCategoryAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockDismissNotificationAsync = jest.fn();
const mockCancelAllScheduledNotificationsAsync = jest.fn();
const mockDismissAllNotificationsAsync = jest.fn();
const mockGetAllScheduledNotificationsAsync = jest.fn();
const mockGetPresentedNotificationsAsync = jest.fn();

jest.mock("expo-notifications", () => ({
  __esModule: true,
  AndroidImportance: { MAX: "max", HIGH: "high" },
  AndroidNotificationPriority: { MAX: "max", HIGH: "high" },
  SchedulableTriggerInputTypes: { DATE: "date", CALENDAR: "calendar" },
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  setNotificationCategoryAsync: (...args: unknown[]) => mockSetNotificationCategoryAsync(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduledNotificationAsync(...args),
  dismissNotificationAsync: (...args: unknown[]) => mockDismissNotificationAsync(...args),
  cancelAllScheduledNotificationsAsync: (...args: unknown[]) => mockCancelAllScheduledNotificationsAsync(...args),
  dismissAllNotificationsAsync: (...args: unknown[]) => mockDismissAllNotificationsAsync(...args),
  getAllScheduledNotificationsAsync: (...args: unknown[]) => mockGetAllScheduledNotificationsAsync(...args),
  getPresentedNotificationsAsync: (...args: unknown[]) => mockGetPresentedNotificationsAsync(...args),
}));

const mockCanScheduleExactAlarms = jest.fn();
const mockOpenSettings = jest.fn();
const mockAlertAlert = jest.fn();

jest.mock("react-native-permissions", () => ({
  __esModule: true,
  canScheduleExactAlarms: (...args: unknown[]) => mockCanScheduleExactAlarms(...args),
  openSettings: (...args: unknown[]) => mockOpenSettings(...args),
}));

jest.mock("react-native", () => ({
  Alert: {
    alert: (...args: unknown[]) => mockAlertAlert(...args),
  },
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
    mockOpenSettings.mockResolvedValue(undefined);
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
});

describe("prepareReminderNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    mockSetNotificationChannelAsync.mockResolvedValue(undefined);
    mockSetNotificationCategoryAsync.mockResolvedValue(undefined);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    mockOpenSettings.mockResolvedValue(undefined);
  });

  it("creates the reminder channel and interactive category", async () => {
    await expect(prepareReminderNotifications()).resolves.toBe(true);

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledWith("habitReminderActions", [
      {
        identifier: REMINDER_ACTION_DONE_IDENTIFIER,
        buttonTitle: "Done",
        options: { opensAppToForeground: false },
      },
      {
        identifier: REMINDER_ACTION_SNOOZE_IDENTIFIER,
        buttonTitle: "Snooze",
        options: { opensAppToForeground: false },
      },
      {
        identifier: REMINDER_ACTION_OPEN_IDENTIFIER,
        buttonTitle: "Open",
        options: { opensAppToForeground: true },
      },
    ]);
  });
});

describe("scheduleTimerNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockSetNotificationChannelAsync.mockResolvedValue(undefined);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    mockOpenSettings.mockResolvedValue(undefined);
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

  it("shows an exact alarm explanation before opening settings for timer notifications", async () => {
    mockCanScheduleExactAlarms.mockResolvedValue(false);

    await expect(scheduleTimerNotification("timer-1", "Deep Work", 5_000)).resolves.toBeUndefined();
    expect(mockAlertAlert).toHaveBeenCalledWith(
      "Allow exact reminders",
      "YAHT needs Alarms & reminders access to fire habit reminders at the exact time you choose.",
      [
        expect.objectContaining({
          text: "Open settings",
        }),
      ],
      { cancelable: false }
    );
    expect(mockOpenSettings).not.toHaveBeenCalled();

    const buttons = mockAlertAlert.mock.calls.at(-1)?.[2] as Array<{ onPress?: () => void }>;
    buttons[0].onPress?.();

    expect(mockOpenSettings).toHaveBeenCalledWith("alarms");
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
    mockGetAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: "timer-timer-1", content: { data: {} } },
      { identifier: "reminder-series-h1-2026-03-21-123000", content: { data: {} } },
    ]);
    mockGetPresentedNotificationsAsync.mockResolvedValue([
      {
        request: {
          identifier: "timer-timer-1",
          content: { data: {} },
        },
      },
      {
        request: {
          identifier: "reminder-series-h1-2026-03-21-123000",
          content: { data: {} },
        },
      },
    ]);

    await cancelAllTimerNotifications();

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith("timer-timer-1");
    expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalledWith("reminder-series-h1-2026-03-21-123000");
    expect(mockDismissNotificationAsync).toHaveBeenCalledWith("timer-timer-1");
    expect(mockDismissNotificationAsync).not.toHaveBeenCalledWith("reminder-series-h1-2026-03-21-123000");
    expect(mockCancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(mockDismissAllNotificationsAsync).not.toHaveBeenCalled();
  });
});

describe("scheduleReminderNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    mockSetNotificationChannelAsync.mockResolvedValue(undefined);
    mockSetNotificationCategoryAsync.mockResolvedValue(undefined);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    mockOpenSettings.mockResolvedValue(undefined);
    mockScheduleNotificationAsync.mockResolvedValue("reminder-series-h1-2026-03-21-123000");
  });

  it("schedules a reminder with series metadata and actions", async () => {
    const result = await scheduleReminderNotification({
      habitId: "h1",
      habitTitle: "Stretch",
      timestamp: 123_000,
      reminderDate: "2026-03-21",
      attemptNumber: 0,
      maxAttempts: 4,
      repeatIntervalMs: 300_000,
    });

    expect(result).toBe("reminder-series-h1-2026-03-21-123000");
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: `reminder-${getReminderNotificationSeriesId("h1", "2026-03-21")}-123000`,
      content: {
        title: "Stretch",
        body: "Time to check in.",
        sound: "default",
        color: "#023c69",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: "habitReminderActions",
        data: {
          kind: "habitReminder",
          habitId: "h1",
          habitTitle: "Stretch",
          reminderDate: "2026-03-21",
          reminderSeriesId: getReminderNotificationSeriesId("h1", "2026-03-21"),
          scheduledFor: 123_000,
          attemptNumber: 0,
          maxAttempts: 4,
          repeatIntervalMs: 300_000,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(123_000),
        channelId: "reminders",
      },
    });
  });

  it("uses alternate copy for follow-up reminders", async () => {
    await schedulePreparedReminderNotification({
      habitId: "h1",
      habitTitle: "Stretch",
      timestamp: 123_000,
      reminderDate: "2026-03-21",
      attemptNumber: 2,
      maxAttempts: 4,
      repeatIntervalMs: 300_000,
    });

    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Stretch",
          body: "Still due. Mark it done when you're finished.",
        }),
      })
    );
  });

  it("uses non-repeating calendar triggers on iOS", async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "ios" });

    await schedulePreparedReminderNotification({
      habitId: "h1",
      habitTitle: "Stretch",
      timestamp: new Date(2026, 2, 21, 9, 30, 0).getTime(),
      reminderDate: "2026-03-21",
      attemptNumber: 0,
      maxAttempts: 1,
    });

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: false,
          year: 2026,
          month: 3,
          day: 21,
          hour: 9,
          minute: 30,
          second: 0,
        },
      })
    );

    Object.defineProperty(Platform, "OS", { value: originalPlatform });
  });

  it("shows an exact alarm explanation before opening settings for reminders", async () => {
    mockCanScheduleExactAlarms.mockResolvedValue(false);

    const result = await scheduleReminderNotification({
      habitId: "h1",
      habitTitle: "Stretch",
      timestamp: 123_000,
      reminderDate: "2026-03-21",
    });

    expect(result).toBeUndefined();
    expect(mockAlertAlert).toHaveBeenCalledWith(
      "Allow exact reminders",
      "YAHT needs Alarms & reminders access to fire habit reminders at the exact time you choose.",
      [
        expect.objectContaining({
          text: "Open settings",
        }),
      ],
      { cancelable: false }
    );
    expect(mockOpenSettings).not.toHaveBeenCalled();

    const buttons = mockAlertAlert.mock.calls.at(-1)?.[2] as Array<{ onPress?: () => void }>;
    expect(buttons).toHaveLength(1);
    buttons[0].onPress?.();

    expect(mockOpenSettings).toHaveBeenCalledWith("alarms");
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not stack exact alarm explanation alerts while one is already visible", async () => {
    mockCanScheduleExactAlarms.mockResolvedValue(false);

    await scheduleReminderNotification({
      habitId: "h1",
      habitTitle: "Stretch",
      timestamp: 123_000,
      reminderDate: "2026-03-21",
    });
    await scheduleReminderNotification({
      habitId: "h1",
      habitTitle: "Stretch",
      timestamp: 124_000,
      reminderDate: "2026-03-21",
    });

    expect(mockAlertAlert).toHaveBeenCalledTimes(1);
    expect(mockOpenSettings).not.toHaveBeenCalled();

    const buttons = mockAlertAlert.mock.calls.at(-1)?.[2] as Array<{ onPress?: () => void }>;
    buttons[0].onPress?.();

    expect(mockOpenSettings).toHaveBeenCalledWith("alarms");
  });

  it("records degraded Android exact alarm diagnostics when exact alarms are unavailable", async () => {
    clearDiagnosticEvents();
    mockCanScheduleExactAlarms.mockResolvedValue(false);

    await expect(
      scheduleReminderNotification({
        habitId: "h1",
        habitTitle: "Stretch",
        timestamp: 123_000,
        reminderDate: "2026-03-21",
      })
    ).resolves.toBeUndefined();

    expect(getDiagnosticEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "warn",
          event: "notifications.exactAlarm.unavailable",
          context: {
            action: "show-exact-alarm-explanation",
            category: "reminders",
            settingsPrompted: true,
          },
        }),
      ])
    );
  });
});

describe("reminder notification cleanup", () => {
  const seriesId = getReminderNotificationSeriesId("h1", "2026-03-21");
  const reminderData = {
    kind: "habitReminder",
    habitId: "h1",
    habitTitle: "Stretch",
    reminderDate: "2026-03-21",
    reminderSeriesId: seriesId,
    scheduledFor: 123_000,
    attemptNumber: 0,
    maxAttempts: 4,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: `reminder-${seriesId}-123000`,
        content: {
          data: reminderData,
        },
      },
      {
        identifier: "timer-t1",
        content: { data: {} },
      },
    ]);
    mockGetPresentedNotificationsAsync.mockResolvedValue([
      {
        request: {
          identifier: `reminder-${seriesId}-123000`,
          content: {
            data: reminderData,
          },
        },
      },
    ]);
  });

  it("clears all scheduled and presented reminder notifications", async () => {
    await clearReminderNotifications();

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(`reminder-${seriesId}-123000`);
    expect(mockDismissNotificationAsync).toHaveBeenCalledWith(`reminder-${seriesId}-123000`);
  });

  it("cancels only one reminder series", async () => {
    await cancelReminderNotificationSeries(seriesId);

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockDismissNotificationAsync).toHaveBeenCalledTimes(1);
  });
});
