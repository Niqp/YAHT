/**
 * Tests for createImportSlice.
 *
 * Covers: importHabits — valid import, filtering invalid habits,
 * null/non-object input error handling.
 */

import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";
import { createImportSlice } from "@/store/habit/importSlice";
import type { HabitState } from "@/store/habitStore";

// ─── Harness ──────────────────────────────────────────────────────────────────

type ImportHarnessState = Pick<HabitState, "habits" | "error">;

function createHarness(initialHabits: HabitMap = {}) {
  let state: ImportHarnessState = {
    habits: initialHabits,
    error: null,
  };

  const set = (updater: Partial<HabitState> | ((s: HabitState) => Partial<HabitState>)) => {
    const partial = typeof updater === "function" ? updater(state as HabitState) : updater;
    state = { ...state, ...partial };
  };

  const get = () => state as HabitState;
  const slice = createImportSlice(set as never, get as never, {} as never);

  return {
    slice,
    getState: () => state,
  };
}

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Test Habit",
    icon: "🧪",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: "2026-01-01",
    ...overrides,
  };
}

// ─── importHabits ─────────────────────────────────────────────────────────────

describe("importHabits", () => {
  it("replaces the store with valid imported habits", async () => {
    const harness = createHarness({ old: makeHabit({ id: "old", title: "Old Habit" }) });
    const imported: HabitMap = {
      h1: makeHabit({ id: "h1", title: "Imported A" }),
      h2: makeHabit({ id: "h2", title: "Imported B" }),
    };

    const count = await harness.slice.importHabits(imported);

    expect(count).toBe(2);
    expect(harness.getState().habits["h1"].title).toBe("Imported A");
    expect(harness.getState().habits["h2"].title).toBe("Imported B");
    // Old habit should be gone
    expect(harness.getState().habits["old"]).toBeUndefined();
  });

  it("returns the count of successfully imported habits", async () => {
    const harness = createHarness();
    const imported: HabitMap = {
      h1: makeHabit({ id: "h1" }),
      h2: makeHabit({ id: "h2" }),
      h3: makeHabit({ id: "h3" }),
    };

    const count = await harness.slice.importHabits(imported);

    expect(count).toBe(3);
  });

  it("clears error state on successful import", async () => {
    const harness = createHarness();
    harness.getState().error = "previous error";

    await harness.slice.importHabits({ h1: makeHabit({ id: "h1" }) });

    expect(harness.getState().error).toBeNull();
  });

  it("filters out habits missing an id", async () => {
    const harness = createHarness();
    const imported = {
      valid: makeHabit({ id: "valid", title: "Valid" }),
      // Cast to bypass TypeScript — simulating bad runtime data
      noId: { title: "No ID", icon: "❌" } as unknown as Habit,
    };

    const count = await harness.slice.importHabits(imported);

    expect(count).toBe(1);
    expect(harness.getState().habits["valid"]).toBeDefined();
  });

  it("filters out habits missing a title", async () => {
    const harness = createHarness();
    const imported = {
      valid: makeHabit({ id: "valid", title: "Valid" }),
      noTitle: { id: "noTitle", icon: "❌" } as unknown as Habit,
    };

    const count = await harness.slice.importHabits(imported);

    expect(count).toBe(1);
    expect(harness.getState().habits["valid"]).toBeDefined();
    expect(harness.getState().habits["noTitle"]).toBeUndefined();
  });

  it("handles an empty import object (zero habits)", async () => {
    const harness = createHarness({ existing: makeHabit({ id: "existing" }) });

    const count = await harness.slice.importHabits({});

    expect(count).toBe(0);
    expect(harness.getState().habits).toEqual({});
  });

  it("throws and sets error when input is null", async () => {
    const harness = createHarness();

    await expect(harness.slice.importHabits(null as unknown as HabitMap)).rejects.toThrow();

    expect(harness.getState().error).toBe("Failed to import habits");
  });

  it("throws and sets error when input is not an object", async () => {
    const harness = createHarness();

    await expect(harness.slice.importHabits("not an object" as unknown as HabitMap)).rejects.toThrow();

    expect(harness.getState().error).toBe("Failed to import habits");
  });
});
