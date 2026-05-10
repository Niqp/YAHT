import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import {
  ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
} from "@/utils/notifications";
import {
  drainAndroidNativeReminderActions,
  setAndroidNativeReminderActionStorageForTests,
} from "@/utils/androidNativeReminderActions";

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

jest.mock("expo-notifications", () => ({}));

jest.mock("react-native-permissions", () => ({
  canScheduleExactAlarms: jest.fn(),
  openSettings: jest.fn(),
}));

const mockStoreState = {
  habits: {} as Record<string, Habit>,
  updateHabit: jest.fn(async (id: string, habit: Partial<Habit>) => {
    mockStoreState.habits[id] = {
      ...mockStoreState.habits[id],
      ...habit,
    };
  }),
  updateCompletion: jest.fn(async ({ id, date, value }: { id: string; date: string; value?: number }) => {
    const habit = mockStoreState.habits[id];
    if (!habit) {
      return;
    }

    mockStoreState.habits[id] = {
      ...habit,
      completionHistory: {
        ...habit.completionHistory,
        [date]: {
          isCompleted: true,
          value: habit.completion.type === CompletionType.SIMPLE ? 0 : value,
        },
      },
    };
  }),
};

jest.mock("@/store/habitStore", () => ({
  useHabitStore: {
    getState: () => mockStoreState,
  },
}));

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
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
    snoozedDate: "2026-03-21",
    snoozedUntilMs: 1_000,
  },
  ...overrides,
});

const createStorage = (records: unknown[]) => {
  const values = new Map([[ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY, JSON.stringify(records)]]);
  return {
    getString: (key: string) => values.get(key),
    delete: (key: string) => {
      values.delete(key);
    },
    values,
  };
};

describe("drainAndroidNativeReminderActions", () => {
  beforeEach(() => {
    mockStoreState.habits = {};
    mockStoreState.updateHabit.mockClear();
    mockStoreState.updateCompletion.mockClear();
    setAndroidNativeReminderActionStorageForTests(undefined);
  });

  it("mirrors a native Done action into the in-memory Zustand store", async () => {
    mockStoreState.habits.h1 = makeHabit();
    const storage = createStorage([
      {
        responseKey: "reminder-series-h1-2026-03-21-1000:habitReminderDone",
        actionIdentifier: REMINDER_ACTION_DONE_IDENTIFIER,
        habitId: "h1",
        reminderDate: "2026-03-21",
        handledAtMs: 2_000,
      },
    ]);
    setAndroidNativeReminderActionStorageForTests(storage);

    await drainAndroidNativeReminderActions();

    expect(mockStoreState.habits.h1.completionHistory["2026-03-21"]).toEqual({
      isCompleted: true,
      value: 0,
    });
    expect(mockStoreState.habits.h1.reminder?.snoozedDate).toBeUndefined();
    expect(mockStoreState.habits.h1.reminder?.snoozedUntilMs).toBeUndefined();
    expect(storage.values.has(ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY)).toBe(false);
  });

  it("mirrors a native Snooze action into the in-memory Zustand store", async () => {
    mockStoreState.habits.h1 = makeHabit({
      reminder: { enabled: true, hour: 9, minute: 0, repeatIfNotCompleted: true },
    });
    const storage = createStorage([
      {
        responseKey: "reminder-series-h1-2026-03-21-1000:habitReminderSnooze",
        actionIdentifier: REMINDER_ACTION_SNOOZE_IDENTIFIER,
        habitId: "h1",
        reminderDate: "2026-03-21",
        handledAtMs: 2_000,
        snoozedUntilMs: 902_000,
      },
    ]);
    setAndroidNativeReminderActionStorageForTests(storage);

    await drainAndroidNativeReminderActions();

    expect(mockStoreState.habits.h1.reminder).toEqual(
      expect.objectContaining({
        snoozedDate: "2026-03-21",
        snoozedUntilMs: 902_000,
      })
    );
    expect(storage.values.has(ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY)).toBe(false);
  });
});
