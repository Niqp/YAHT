import * as Notifications from "expo-notifications";

const mockAddNotificationResponseReceivedListener = jest.fn(
  (_listener: (response: Notifications.NotificationResponse) => void) => ({
    remove: jest.fn(),
  })
);
const mockRegisterTaskAsync = jest.fn((_taskName: string) => Promise.resolve());
const mockWaitForHabitStoreHydration = jest.fn();
const mockHandleReminderNotificationResponse = jest.fn(
  (_response: Notifications.NotificationResponse, _options: unknown) => Promise.resolve({ handled: true })
);

const REMINDER_ACTION_DONE_IDENTIFIER = "habitReminderDone";
const REMINDER_ACTION_SNOOZE_IDENTIFIER = "habitReminderSnooze";
const REMINDER_ACTION_OPEN_IDENTIFIER = "habitReminderOpen";

jest.mock("expo-notifications", () => ({
  __esModule: true,
  addNotificationResponseReceivedListener: (listener: (response: Notifications.NotificationResponse) => void) =>
    mockAddNotificationResponseReceivedListener(listener),
  registerTaskAsync: (taskName: string) => mockRegisterTaskAsync(taskName),
}));

jest.mock("@/utils/reminderNotificationTask", () => ({
  REMINDER_NOTIFICATION_TASK: "YAHTReminderNotificationTask",
}));

jest.mock("@/utils/habitStoreHydration", () => ({
  waitForHabitStoreHydration: (...args: unknown[]) => mockWaitForHabitStoreHydration(...args),
}));

jest.mock("@/utils/reminderNotificationResponse", () => ({
  isReminderQuickActionResponse: (response: Notifications.NotificationResponse) =>
    response.actionIdentifier === REMINDER_ACTION_DONE_IDENTIFIER ||
    response.actionIdentifier === REMINDER_ACTION_SNOOZE_IDENTIFIER,
  handleReminderNotificationResponse: (response: Notifications.NotificationResponse, options: unknown) =>
    mockHandleReminderNotificationResponse(response, options),
}));

const createResponse = (actionIdentifier: string): Notifications.NotificationResponse =>
  ({
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
  }) as Notifications.NotificationResponse;

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("registerReminderNotificationTask native early listener", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockWaitForHabitStoreHydration.mockResolvedValue(true);
    mockHandleReminderNotificationResponse.mockResolvedValue({ handled: true });
  });

  const registerAndGetListener = () => {
    const { registerReminderNotificationTask } = require("@/utils/registerReminderNotificationTask.native");

    registerReminderNotificationTask();

    return mockAddNotificationResponseReceivedListener.mock.calls[0][0] as (
      response: Notifications.NotificationResponse
    ) => void;
  };

  it("waits for hydration before handling quick actions with targeted background completion", async () => {
    const listener = registerAndGetListener();
    const response = createResponse(REMINDER_ACTION_DONE_IDENTIFIER);

    listener(response);

    expect(mockHandleReminderNotificationResponse).not.toHaveBeenCalled();
    await flushMicrotasks();

    expect(mockWaitForHabitStoreHydration).toHaveBeenCalledTimes(1);
    expect(mockHandleReminderNotificationResponse).toHaveBeenCalledWith(response, {
      allowNavigation: false,
      completionMode: "targeted-background",
    });
  });

  it("does not handle or claim quick actions when hydration fails", async () => {
    mockWaitForHabitStoreHydration.mockResolvedValue(false);
    const listener = registerAndGetListener();

    listener(createResponse(REMINDER_ACTION_DONE_IDENTIFIER));
    await flushMicrotasks();

    expect(mockHandleReminderNotificationResponse).not.toHaveBeenCalled();
  });

  it("serializes multiple early quick actions", async () => {
    let releaseFirstHydration!: () => void;
    mockWaitForHabitStoreHydration
      .mockReturnValueOnce(
        new Promise<boolean>((resolve) => {
          releaseFirstHydration = () => resolve(true);
        })
      )
      .mockResolvedValueOnce(true);

    const listener = registerAndGetListener();
    const firstResponse = createResponse(REMINDER_ACTION_DONE_IDENTIFIER);
    const secondResponse = createResponse(REMINDER_ACTION_SNOOZE_IDENTIFIER);

    listener(firstResponse);
    listener(secondResponse);
    await flushMicrotasks();

    expect(mockWaitForHabitStoreHydration).toHaveBeenCalledTimes(1);
    expect(mockHandleReminderNotificationResponse).not.toHaveBeenCalled();

    releaseFirstHydration();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(mockWaitForHabitStoreHydration).toHaveBeenCalledTimes(2);
    expect(mockHandleReminderNotificationResponse.mock.calls.map((call) => call[0])).toEqual([
      firstResponse,
      secondResponse,
    ]);
  });

  it("ignores non quick-action responses", async () => {
    const listener = registerAndGetListener();

    listener(createResponse(REMINDER_ACTION_OPEN_IDENTIFIER));
    await flushMicrotasks();

    expect(mockWaitForHabitStoreHydration).not.toHaveBeenCalled();
    expect(mockHandleReminderNotificationResponse).not.toHaveBeenCalled();
  });
});
