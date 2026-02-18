/**
 * Tests for createCRUDSlice.
 *
 * Covers: addHabit, updateHabit, deleteHabit, getHabitById, resetStore.
 */

import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";
import { createCRUDSlice } from "@/store/habit/crudSlice";
import type { HabitState } from "@/store/habitStore";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "generated-uuid"),
}));

// ─── Harness ──────────────────────────────────────────────────────────────────

type CRUDHarnessState = Pick<HabitState, "habits" | "activeTimers" | "selectedDate" | "error" | "timerRenderTickMs">;

function createHarness(initialHabits: HabitMap = {}) {
  let state: CRUDHarnessState = {
    habits: initialHabits,
    activeTimers: {},
    selectedDate: "2026-01-01",
    error: null,
    timerRenderTickMs: 0,
  };

  const set = (updater: Partial<HabitState> | ((s: HabitState) => Partial<HabitState>)) => {
    const partial = typeof updater === "function" ? updater(state as HabitState) : updater;
    state = { ...state, ...partial };
  };

  const get = () => state as HabitState;
  const slice = createCRUDSlice(set as never, get as never, {} as never);

  return {
    slice,
    getState: () => state,
  };
}

function makeHabitData(overrides: Partial<Omit<Habit, "id">> = {}): Omit<Habit, "id"> {
  return {
    title: "Test Habit",
    icon: "🧪",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: "2026-01-01",
    ...overrides,
  };
}

// ─── addHabit ─────────────────────────────────────────────────────────────────

describe("addHabit", () => {
  it("adds a new habit with a generated UUID", async () => {
    const harness = createHarness();
    await harness.slice.addHabit(makeHabitData());

    const habits = harness.getState().habits;
    expect(habits["generated-uuid"]).toBeDefined();
    expect(habits["generated-uuid"].title).toBe("Test Habit");
  });

  it("clears error state on success", async () => {
    const harness = createHarness();
    harness.getState().error = "previous error";
    await harness.slice.addHabit(makeHabitData());

    expect(harness.getState().error).toBeNull();
  });

  it("does not overwrite an existing habit with the same ID", async () => {
    const existingHabit: Habit = {
      id: "generated-uuid",
      title: "Original",
      icon: "⭐",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ "generated-uuid": existingHabit });

    await harness.slice.addHabit(makeHabitData({ title: "Duplicate" }));

    // Should still be the original
    expect(harness.getState().habits["generated-uuid"].title).toBe("Original");
  });

  it("preserves existing habits when adding a new one", async () => {
    const existing: Habit = {
      id: "existing-id",
      title: "Existing",
      icon: "📌",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ "existing-id": existing });

    await harness.slice.addHabit(makeHabitData({ title: "New Habit" }));

    expect(harness.getState().habits["existing-id"]).toBeDefined();
    expect(harness.getState().habits["generated-uuid"]).toBeDefined();
  });
});

// ─── updateHabit ──────────────────────────────────────────────────────────────

describe("updateHabit", () => {
  it("merges partial data into an existing habit", async () => {
    const habit: Habit = {
      id: "h1",
      title: "Old Title",
      icon: "🔵",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ h1: habit });

    await harness.slice.updateHabit("h1", { title: "New Title", icon: "🟢" });

    const updated = harness.getState().habits["h1"];
    expect(updated.title).toBe("New Title");
    expect(updated.icon).toBe("🟢");
    // Other fields preserved
    expect(updated.createdAt).toBe("2026-01-01");
  });

  it("does nothing when the habit ID does not exist", async () => {
    const harness = createHarness({});
    await harness.slice.updateHabit("nonexistent", { title: "Ghost" });

    expect(harness.getState().habits["nonexistent"]).toBeUndefined();
  });

  it("clears error state on success", async () => {
    const habit: Habit = {
      id: "h1",
      title: "Habit",
      icon: "🔵",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ h1: habit });
    harness.getState().error = "old error";

    await harness.slice.updateHabit("h1", { title: "Updated" });

    expect(harness.getState().error).toBeNull();
  });
});

// ─── deleteHabit ──────────────────────────────────────────────────────────────

describe("deleteHabit", () => {
  it("removes the habit from the map", async () => {
    const habit: Habit = {
      id: "h1",
      title: "To Delete",
      icon: "🗑️",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ h1: habit });

    await harness.slice.deleteHabit("h1");

    expect(harness.getState().habits["h1"]).toBeUndefined();
  });

  it("does not affect other habits when deleting one", async () => {
    const h1: Habit = {
      id: "h1",
      title: "Keep",
      icon: "✅",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const h2: Habit = { ...h1, id: "h2", title: "Delete Me" };
    const harness = createHarness({ h1, h2 });

    await harness.slice.deleteHabit("h2");

    expect(harness.getState().habits["h1"]).toBeDefined();
    expect(harness.getState().habits["h2"]).toBeUndefined();
  });

  it("is a no-op when the habit ID does not exist", async () => {
    const habit: Habit = {
      id: "h1",
      title: "Existing",
      icon: "📌",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ h1: habit });

    await harness.slice.deleteHabit("nonexistent");

    expect(Object.keys(harness.getState().habits)).toHaveLength(1);
  });
});

// ─── getHabitById ─────────────────────────────────────────────────────────────

describe("getHabitById", () => {
  it("returns the habit when it exists", () => {
    const habit: Habit = {
      id: "h1",
      title: "Found",
      icon: "🔍",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ h1: habit });

    expect(harness.slice.getHabitById("h1")).toEqual(habit);
  });

  it("returns undefined when the habit does not exist", () => {
    const harness = createHarness({});
    expect(harness.slice.getHabitById("missing")).toBeUndefined();
  });
});

// ─── resetStore ───────────────────────────────────────────────────────────────

describe("resetStore", () => {
  it("clears all habits", () => {
    const habit: Habit = {
      id: "h1",
      title: "Will Be Cleared",
      icon: "🧹",
      repetition: { type: RepetitionType.DAILY },
      completion: { type: CompletionType.SIMPLE },
      completionHistory: {},
      createdAt: "2026-01-01",
    };
    const harness = createHarness({ h1: habit });

    harness.slice.resetStore();

    expect(harness.getState().habits).toEqual({});
  });

  it("clears active timers", () => {
    const harness = createHarness();
    harness.getState().activeTimers = {
      h1: { "2026-01-01": { id: "t1", lastResumedAt: "2026-01-01T10:00:00.000Z" } },
    };

    harness.slice.resetStore();

    expect(harness.getState().activeTimers).toEqual({});
  });

  it("clears error state", () => {
    const harness = createHarness();
    harness.getState().error = "some error";

    harness.slice.resetStore();

    expect(harness.getState().error).toBeNull();
  });
});
