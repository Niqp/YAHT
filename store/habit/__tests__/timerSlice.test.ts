import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";
import { createTimerSlice } from "@/store/habit/timerSlice";
import type { HabitState } from "@/store/habitStore";
import type { CompletionData } from "@/store/habit/completionSlice";
import { setNotification, cancelNotification } from "@/utils/notifications";

jest.mock("@/utils/notifications", () => ({
  setNotification: jest.fn(),
  cancelNotification: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "timer-1"),
}));

const DATE = "2026-02-16";
const DEFAULT_NOW = "2026-02-16T10:00:00.000Z";

type TimerHarnessState = Pick<HabitState, "habits" | "activeTimers" | "selectedDate" | "error" | "timerRenderTickMs"> & {
  updateCompletion: HabitState["updateCompletion"];
  updateCompletionMultiple: HabitState["updateCompletionMultiple"];
};

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    title: "Timed Habit",
    icon: "*",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.TIMED, goal: 5_000 },
    completionHistory: {},
    createdAt: "2026-01-01",
    ...overrides,
  };
}

function createHarness(initialHabits: HabitMap, selectedDate = DATE) {
  let state: TimerHarnessState = {
    habits: initialHabits,
    activeTimers: {},
    selectedDate,
    error: null,
    timerRenderTickMs: 0,
    updateCompletion: async () => {},
    updateCompletionMultiple: async () => {},
  };

  const set = (updater: Partial<HabitState> | ((s: HabitState) => Partial<HabitState>)) => {
    const partial = typeof updater === "function" ? updater(state as HabitState) : updater;
    state = { ...state, ...partial };
  };

  const applyCompletionUpdate = async ({ id, date, value }: CompletionData) => {
    const resolvedDate = date || selectedDate;
    const habit = state.habits[id];
    if (!habit) return;
    const goal = habit.completion.goal || 0;
    const resolvedValue = value || 0;

    state = {
      ...state,
      habits: {
        ...state.habits,
        [id]: {
          ...habit,
          completionHistory: {
            ...habit.completionHistory,
            [resolvedDate]: {
              isCompleted: resolvedValue >= goal,
              value: resolvedValue,
            },
          },
        },
      },
    };
  };

  const get = () => state as HabitState;
  const slice = createTimerSlice(set as never, get as never, {} as never);

  const updateCompletion = jest.fn(applyCompletionUpdate);
  const updateCompletionMultiple = jest.fn(async (updates: CompletionData[]) => {
    for (const update of updates) {
      await applyCompletionUpdate(update);
    }
  });

  state.updateCompletion = updateCompletion as HabitState["updateCompletion"];
  state.updateCompletionMultiple = updateCompletionMultiple as HabitState["updateCompletionMultiple"];

  return {
    slice,
    getState: () => state,
    setState: (partial: Partial<TimerHarnessState>) => {
      state = { ...state, ...partial };
    },
    updateCompletion,
    updateCompletionMultiple,
  };
}

describe("createTimerSlice behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("activates timer and schedules notification", () => {
    const harness = createHarness({ h1: makeHabit({ id: "h1" }) });
    const resumedAt = harness.slice.activateTimer("h1", DATE);
    const timer = harness.getState().activeTimers.h1[DATE];

    expect(timer.id).toBe("timer-1");
    expect(timer.lastResumedAt).toBe(resumedAt);
    expect(setNotification).toHaveBeenCalledTimes(1);
  });

  it("removes timer, applies final completion, and cancels notification", async () => {
    const harness = createHarness({
      h1: makeHabit({
        id: "h1",
        completionHistory: {
          [DATE]: { isCompleted: false, value: 2_000 },
        },
      }),
    });
    harness.setState({
      activeTimers: {
        h1: {
          [DATE]: { id: "timer-1", lastResumedAt: "2026-02-16T09:59:55.000Z" },
        },
      },
    });

    await harness.slice.removeTimer("h1", DATE, DEFAULT_NOW);

    expect(harness.updateCompletion).toHaveBeenCalledWith({ id: "h1", date: DATE, value: 7_000 });
    expect(cancelNotification).toHaveBeenCalledWith("timer-1");
    expect(harness.getState().activeTimers.h1).toBeUndefined();
  });

  it("reconciles active timers and updates timestamps", async () => {
    const harness = createHarness({
      h1: makeHabit({
        id: "h1",
        completionHistory: {
          [DATE]: { isCompleted: false, value: 1_000 },
        },
      }),
    });
    harness.setState({
      activeTimers: {
        h1: {
          [DATE]: { id: "timer-1", lastResumedAt: "2026-02-16T09:59:57.000Z" },
        },
      },
    });

    await harness.slice.reconcileActiveTimers(DEFAULT_NOW);

    expect(harness.updateCompletionMultiple).toHaveBeenCalledTimes(1);
    expect(harness.updateCompletionMultiple.mock.calls[0][0]).toEqual([{ id: "h1", date: DATE, value: 4_000 }]);
    expect(harness.getState().activeTimers.h1[DATE].lastResumedAt).toBe(DEFAULT_NOW);
  });

  it("clamps negative elapsed during reconcile", async () => {
    const harness = createHarness({
      h1: makeHabit({
        id: "h1",
        completionHistory: {
          [DATE]: { isCompleted: false, value: 1_000 },
        },
      }),
    });
    harness.setState({
      activeTimers: {
        h1: {
          [DATE]: { id: "timer-1", lastResumedAt: "2026-02-16T10:00:05.000Z" },
        },
      },
    });

    await harness.slice.reconcileActiveTimers(DEFAULT_NOW);

    expect(harness.updateCompletionMultiple.mock.calls[0][0]).toEqual([{ id: "h1", date: DATE, value: 1_000 }]);
  });

  it("keeps timer active when goal is reached during reconcile", async () => {
    const harness = createHarness({
      h1: makeHabit({
        id: "h1",
        completion: { type: CompletionType.TIMED, goal: 2_000 },
      }),
    });
    harness.setState({
      activeTimers: {
        h1: {
          [DATE]: { id: "timer-1", lastResumedAt: "2026-02-16T09:59:57.000Z" },
        },
      },
    });

    await harness.slice.reconcileActiveTimers(DEFAULT_NOW);

    expect(harness.getState().habits.h1.completionHistory[DATE]).toEqual({ isCompleted: true, value: 3_000 });
    expect(harness.getState().activeTimers.h1?.[DATE]).toBeDefined();
  });

  it("ticks foreground render signal", () => {
    const harness = createHarness({ h1: makeHabit({ id: "h1" }) });
    harness.slice.tickForeground(1234);
    expect(harness.getState().timerRenderTickMs).toBe(1234);
  });
});
