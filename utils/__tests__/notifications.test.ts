/**
 * Tests for utils/notifications.ts
 *
 * All @notifee/react-native calls are mocked so no native runtime is needed.
 */

import dayjs from "dayjs";
import { AuthorizationStatus, AndroidNotificationSetting, TriggerType, RepeatFrequency } from "@notifee/react-native";

// ── Mock notifee ──────────────────────────────────────────────────────────────

const mockGetNotificationSettings = jest.fn();
const mockRequestPermission = jest.fn();
const mockOpenAlarmPermissionSettings = jest.fn();
const mockCreateChannel = jest.fn();
const mockCreateTriggerNotification = jest.fn();
const mockCancelNotification = jest.fn();
const mockCancelAllNotifications = jest.fn();

jest.mock("@notifee/react-native", () => ({
    __esModule: true,
    default: {
        getNotificationSettings: (...args: unknown[]) => mockGetNotificationSettings(...args),
        requestPermission: (...args: unknown[]) => mockRequestPermission(...args),
        openAlarmPermissionSettings: (...args: unknown[]) => mockOpenAlarmPermissionSettings(...args),
        createChannel: (...args: unknown[]) => mockCreateChannel(...args),
        createTriggerNotification: (...args: unknown[]) => mockCreateTriggerNotification(...args),
        cancelNotification: (...args: unknown[]) => mockCancelNotification(...args),
        cancelAllNotifications: (...args: unknown[]) => mockCancelAllNotifications(...args),
    },
    TriggerType: { TIMESTAMP: "TIMESTAMP" },
    RepeatFrequency: { WEEKLY: "WEEKLY" },
    AndroidNotificationSetting: { ENABLED: "ENABLED" },
    AuthorizationStatus: { AUTHORIZED: "AUTHORIZED" },
}));

// ── Mock Platform ─────────────────────────────────────────────────────────────

jest.mock("react-native/Libraries/Utilities/Platform", () => ({
    OS: "android",
    select: (obj: Record<string, unknown>) => obj.android,
}));

import { setNotification, cancelNotification, cancelAllNotifications } from "@/utils/notifications";

// ── Helpers ───────────────────────────────────────────────────────────────────

const authorizedSettings = {
    authorizationStatus: AuthorizationStatus.AUTHORIZED,
    android: { alarm: AndroidNotificationSetting.ENABLED },
};

const futureDate = dayjs().add(1, "hour");

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("setNotification", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetNotificationSettings.mockResolvedValue(authorizedSettings);
        mockCreateChannel.mockResolvedValue("default");
        mockCreateTriggerNotification.mockResolvedValue("notif-id-123");
    });

    it("creates a trigger notification and returns its id", async () => {
        const result = await setNotification("timer-1", "Morning Run", futureDate);
        expect(mockCreateTriggerNotification).toHaveBeenCalledTimes(1);
        expect(result).toBe("notif-id-123");
    });

    it("passes the correct notification id and body", async () => {
        await setNotification("timer-abc", "Meditation", futureDate);
        const [notification] = mockCreateTriggerNotification.mock.calls[0];
        expect(notification.id).toBe("timer-abc");
        expect(notification.body).toContain("Meditation");
    });

    it("uses a TIMESTAMP trigger with WEEKLY repeat", async () => {
        await setNotification("t1", "Habit", futureDate);
        const [, trigger] = mockCreateTriggerNotification.mock.calls[0];
        expect(trigger.type).toBe(TriggerType.TIMESTAMP);
        expect(trigger.repeatFrequency).toBe(RepeatFrequency.WEEKLY);
        expect(trigger.timestamp).toBe(futureDate.valueOf());
    });

    it("does not request permission when already authorized", async () => {
        await setNotification("t1", "Habit", futureDate);
        expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it("requests permission when not authorized", async () => {
        mockGetNotificationSettings.mockResolvedValue({
            authorizationStatus: "denied",
            android: { alarm: AndroidNotificationSetting.ENABLED },
        });
        await setNotification("t1", "Habit", futureDate);
        expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });

    it("opens alarm settings when alarm permission is not enabled (Android)", async () => {
        mockGetNotificationSettings.mockResolvedValue({
            authorizationStatus: AuthorizationStatus.AUTHORIZED,
            android: { alarm: "disabled" },
        });
        await setNotification("t1", "Habit", futureDate);
        expect(mockOpenAlarmPermissionSettings).toHaveBeenCalledTimes(1);
    });

    it("returns undefined and does not throw when notifee throws", async () => {
        mockCreateTriggerNotification.mockRejectedValue(new Error("native error"));
        const result = await setNotification("t1", "Habit", futureDate);
        expect(result).toBeUndefined();
    });
});

describe("cancelNotification", () => {
    beforeEach(() => jest.clearAllMocks());

    it("calls notifee.cancelNotification with the correct id", async () => {
        mockCancelNotification.mockResolvedValue(undefined);
        await cancelNotification("notif-xyz");
        expect(mockCancelNotification).toHaveBeenCalledWith("notif-xyz");
    });

    it("does not throw when notifee throws", async () => {
        mockCancelNotification.mockRejectedValue(new Error("fail"));
        await expect(cancelNotification("notif-xyz")).resolves.toBeUndefined();
    });
});

describe("cancelAllNotifications", () => {
    beforeEach(() => jest.clearAllMocks());

    it("calls notifee.cancelAllNotifications", async () => {
        mockCancelAllNotifications.mockResolvedValue(undefined);
        await cancelAllNotifications();
        expect(mockCancelAllNotifications).toHaveBeenCalledTimes(1);
    });

    it("does not throw when notifee throws", async () => {
        mockCancelAllNotifications.mockRejectedValue(new Error("fail"));
        await expect(cancelAllNotifications()).resolves.toBeUndefined();
    });
});
