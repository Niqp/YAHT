import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";
import { createCompletionSlice } from "@/store/habit/completionSlice";
import type { HabitState } from "@/store/habitStore";

const DATE = "2026-02-16";

type MinimalState = Pick<HabitState, "habits" | "selectedDate" | "activeTimers" | "error"> & {
  updateCompletion: HabitState["updateCompletion"];
};

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    title: "Test Habit",
    icon: "*",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: "2026-01-01",
    ...overrides,
  };
}

function createHarness(initialHabits: HabitMap, selectedDate = DATE) {
  let state: MinimalState = {
    habits: initialHabits,
    selectedDate,
    activeTimers: {},
    error: null,
    updateCompletion: async () => {},
  };

  const set = (updater: Partial<HabitState> | ((s: HabitState) => Partial<HabitState>)) => {
    const partial = typeof updater === "function" ? updater(state as HabitState) : updater;
    state = { ...state, ...partial };
  };

  const get = () => state as HabitState;

  const slice = createCompletionSlice(set as never, get as never, {} as never);
  state.updateCompletion = slice.updateCompletion;

  return {
    slice,
    getState: () => state,
    setState: (partial: Partial<MinimalState>) => {
      state = { ...state, ...partial };
    },
  };
}

describe("createCompletionSlice behavior", () => {
  it("toggles simple completion by date and removes the entry on second toggle", async () => {
    const harness = createHarness({ h1: makeHabit({ id: "h1" }) });

    await harness.slice.updateCompletion({ id: "h1", date: DATE });
    const afterFirst = harness.getState().habits.h1.completionHistory;
    expect(afterFirst[DATE]).toEqual({ isCompleted: true, value: 0 });

    await harness.slice.updateCompletion({ id: "h1", date: DATE });
    const afterSecond = harness.getState().habits.h1.completionHistory;
    expect(afterSecond[DATE]).toBeUndefined();
  });

  it("keeps a date key when a timer is running (no delete branch)", async () => {
    const harness = createHarness({
      h1: makeHabit({
        id: "h1",
        completionHistory: {
          [DATE]: { isCompleted: true, value: 0 },
        },
      }),
    });

    harness.setState({
      activeTimers: {
        h1: {
          [DATE]: {
            id: "timer-1",
            lastResumedAt: "2026-02-16T10:00:00.000Z",
          },
        },
      },
    });

    await harness.slice.updateCompletion({ id: "h1", date: DATE });
    const completionHistory = harness.getState().habits.h1.completionHistory;

    expect(completionHistory[DATE]).toEqual({ isCompleted: false, value: 0 });
  });

  it("marks repetitions complete when value reaches goal", async () => {
    const harness = createHarness({
      h1: makeHabit({
        id: "h1",
        completion: { type: CompletionType.REPETITIONS, goal: 5 },
      }),
    });

    await harness.slice.updateCompletion({ id: "h1", date: DATE, value: 3 });
    expect(harness.getState().habits.h1.completionHistory[DATE]).toEqual({ isCompleted: false, value: 3 });

    await harness.slice.updateCompletion({ id: "h1", date: DATE, value: 5 });
    expect(harness.getState().habits.h1.completionHistory[DATE]).toEqual({ isCompleted: true, value: 5 });
  });

  it("updates multiple completions sequentially", async () => {
    const harness = createHarness({ h1: makeHabit({ id: "h1" }) });

    await harness.slice.updateCompletionMultiple([
      { id: "h1", date: "2026-02-16" },
      { id: "h1", date: "2026-02-17" },
    ]);

    const completionHistory = harness.getState().habits.h1.completionHistory;
    expect(completionHistory["2026-02-16"]?.isCompleted).toBe(true);
    expect(completionHistory["2026-02-17"]?.isCompleted).toBe(true);
  });
});
