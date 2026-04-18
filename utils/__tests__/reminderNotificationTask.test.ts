import * as Notifications from "expo-notifications";

const mockDefineTask = jest.fn();
const mockWaitForHabitStoreHydration = jest.fn();
const mockHandleReminderNotificationResponse = jest.fn();

const REMINDER_ACTION_DONE_IDENTIFIER = "habitReminderDone";
const REMINDER_ACTION_OPEN_IDENTIFIER = "habitReminderOpen";

jest.mock("expo-task-manager", () => ({
  defineTask: (...args: unknown[]) => mockDefineTask(...args),
}));

jest.mock("expo-notifications", () => ({
  __esModule: true,
}));

jest.mock("expo-notifications/build/BackgroundNotificationTasksModule.types", () => ({
  BackgroundNotificationResult: {
    NoData: "NoData",
    NewData: "NewData",
    Failed: "Failed",
  },
}));

jest.mock("@/utils/habitStoreHydration", () => ({
  waitForHabitStoreHydration: (...args: unknown[]) => mockWaitForHabitStoreHydration(...args),
}));

jest.mock("@/utils/reminderNotificationResponse", () => {
  return {
    isReminderQuickActionResponse: (response: Notifications.NotificationResponse) =>
      response.actionIdentifier === REMINDER_ACTION_DONE_IDENTIFIER ||
      response.actionIdentifier === "habitReminderSnooze",
    handleReminderNotificationResponse: (...args: unknown[]) => mockHandleReminderNotificationResponse(...args),
  };
});

const createTaskPayload = (actionIdentifier: string): Notifications.NotificationResponse => ({
  actionIdentifier,
  notification: {
    date: 123_000,
    request: {
      identifier: `reminder-${actionIdentifier}`,
      content: {
        title: "habitReminder",
        subtitle: null,
        body: null,
        data: {},
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

describe("reminder notification task", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockWaitForHabitStoreHydration.mockResolvedValue(true);
    mockHandleReminderNotificationResponse.mockResolvedValue({ handled: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const loadTaskExecutor = () => {
    jest.isolateModules(() => {
      require("@/utils/reminderNotificationTask");
    });

    return mockDefineTask.mock.calls[0][1] as (body: { data: unknown; error?: Error }) => Promise<string>;
  };

  it("handles Android-style quick action payloads", async () => {
    const taskExecutor = loadTaskExecutor();
    const payload = createTaskPayload(REMINDER_ACTION_DONE_IDENTIFIER);

    await expect(taskExecutor({ data: payload })).resolves.toBe("NewData");

    expect(mockWaitForHabitStoreHydration).toHaveBeenCalledTimes(1);
    expect(mockHandleReminderNotificationResponse).toHaveBeenCalledWith(payload, { allowNavigation: false });
  });

  it("returns NoData for duplicate actions ignored by the shared handler", async () => {
    mockHandleReminderNotificationResponse.mockResolvedValue({ handled: false });
    const taskExecutor = loadTaskExecutor();

    await expect(taskExecutor({ data: createTaskPayload(REMINDER_ACTION_DONE_IDENTIFIER) })).resolves.toBe("NoData");
  });

  it("ignores non-response and non-quick-action payloads", async () => {
    const taskExecutor = loadTaskExecutor();

    await expect(taskExecutor({ data: { data: { dataString: "{}" }, notification: null } })).resolves.toBe("NoData");
    await expect(taskExecutor({ data: createTaskPayload(REMINDER_ACTION_OPEN_IDENTIFIER) })).resolves.toBe("NoData");
    expect(mockHandleReminderNotificationResponse).not.toHaveBeenCalled();
  });

  it("returns Failed when the task receives an error", async () => {
    const taskExecutor = loadTaskExecutor();

    await expect(
      taskExecutor({ data: createTaskPayload(REMINDER_ACTION_DONE_IDENTIFIER), error: new Error("boom") })
    ).resolves.toBe("Failed");
  });
});
