/**
 * Integration tests for store/habitStore.ts
 *
 * Tests the composed store: hydration flag, setSelectedDate,
 * and cross-slice coordination (CRUD + completion + import).
 *
 * We bypass the persist middleware by mocking zustand/middleware,
 * so the store runs in-memory with no MMKV dependency.
 */

// ── Mock MMKV ─────────────────────────────────────────────────────────────────

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// ── Mock expo-crypto for deterministic UUIDs ──────────────────────────────────

let mockUuidCounter = 0;
jest.mock("expo-crypto", () => ({
  randomUUID: () => `test-uuid-${++mockUuidCounter}`,
}));

// ── Mock notifications (called by timerSlice) ─────────────────────────────────

jest.mock("@/utils/notifications", () => ({
  setNotification: jest.fn().mockResolvedValue("notif-id"),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
}));

// ── Mock Zustand persist as a pass-through ────────────────────────────────────

jest.mock("zustand/middleware", () => ({
  ...jest.requireActual("zustand/middleware"),
  persist: (fn: unknown, _opts: unknown) => fn,
}));

import { useHabitStore } from "@/store/habitStore";
import { CompletionType, RepetitionType } from "@/types/habit";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

function resetStore() {
  mockUuidCounter = 0;
  useHabitStore.getState().resetStore();
}

const baseHabit = {
  title: "Morning Run",
  icon: "🏃",
  repetition: { type: RepetitionType.DAILY },
  completion: { type: CompletionType.SIMPLE },
  completionHistory: {},
  createdAt: TODAY,
} as const;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("habitStore integration", () => {
  beforeEach(() => resetStore());

  // ── Hydration ──────────────────────────────────────────────────────────────

  describe("hydration", () => {
    it("starts with _hasHydrated = false", () => {
      expect(useHabitStore.getState()._hasHydrated).toBe(false);
    });

    it("setHydrationState(true) marks the store as hydrated", () => {
      useHabitStore.getState().setHydrationState(true);
      expect(useHabitStore.getState()._hasHydrated).toBe(true);
    });
  });

  // ── selectedDate ───────────────────────────────────────────────────────────

  describe("setSelectedDate", () => {
    it("updates the selectedDate", () => {
      useHabitStore.getState().setSelectedDate("2026-01-15");
      expect(useHabitStore.getState().selectedDate).toBe("2026-01-15");
    });
  });

  // ── CRUD + completion cross-slice ──────────────────────────────────────────

  describe("cross-slice: add then complete", () => {
    it("adds a habit and then toggles its completion", async () => {
      await useHabitStore.getState().addHabit(baseHabit);
      const habitId = Object.keys(useHabitStore.getState().habits)[0];
      expect(habitId).toBeDefined();

      await useHabitStore.getState().updateCompletion({ id: habitId, date: TODAY });
      const entry = useHabitStore.getState().habits[habitId].completionHistory[TODAY];
      expect(entry.isCompleted).toBe(true);
    });

    it("toggling a completed simple habit marks it incomplete", async () => {
      await useHabitStore.getState().addHabit(baseHabit);
      const habitId = Object.keys(useHabitStore.getState().habits)[0];

      // Complete it
      await useHabitStore.getState().updateCompletion({ id: habitId, date: TODAY });
      expect(useHabitStore.getState().habits[habitId].completionHistory[TODAY]?.isCompleted).toBe(true);

      // Toggle back
      await useHabitStore.getState().updateCompletion({ id: habitId, date: TODAY });
      expect(useHabitStore.getState().habits[habitId].completionHistory[TODAY]).toBeUndefined();
    });
  });

  describe("cross-slice: import then delete", () => {
    it("imports habits and then deletes one", async () => {
      const imported = {
        "imported-1": { ...baseHabit, id: "imported-1", title: "Yoga" },
        "imported-2": { ...baseHabit, id: "imported-2", title: "Reading" },
      };

      await useHabitStore.getState().importHabits(imported);
      expect(Object.keys(useHabitStore.getState().habits)).toHaveLength(2);

      await useHabitStore.getState().deleteHabit("imported-1");
      expect(Object.keys(useHabitStore.getState().habits)).toHaveLength(1);
      expect(useHabitStore.getState().habits["imported-2"]).toBeDefined();
    });
  });

  describe("cross-slice: updateCompletionMultiple", () => {
    it("applies multiple completion updates in sequence", async () => {
      await useHabitStore.getState().addHabit({ ...baseHabit, title: "H1" });
      await useHabitStore.getState().addHabit({ ...baseHabit, title: "H2" });
      const [id1, id2] = Object.keys(useHabitStore.getState().habits);

      await useHabitStore.getState().updateCompletionMultiple([
        { id: id1, date: TODAY },
        { id: id2, date: TODAY },
      ]);

      expect(useHabitStore.getState().habits[id1].completionHistory[TODAY]?.isCompleted).toBe(true);
      expect(useHabitStore.getState().habits[id2].completionHistory[TODAY]?.isCompleted).toBe(true);
    });
  });

  // ── resetStore ─────────────────────────────────────────────────────────────

  describe("resetStore", () => {
    it("clears all habits and active timers", async () => {
      await useHabitStore.getState().addHabit(baseHabit);
      expect(Object.keys(useHabitStore.getState().habits)).toHaveLength(1);

      useHabitStore.getState().resetStore();
      expect(Object.keys(useHabitStore.getState().habits)).toHaveLength(0);
      expect(Object.keys(useHabitStore.getState().activeTimers)).toHaveLength(0);
    });
  });

  // ── error state ────────────────────────────────────────────────────────────

  describe("error state", () => {
    it("starts with null error", () => {
      expect(useHabitStore.getState().error).toBeNull();
    });

    it("addHabit clears any previous error", async () => {
      useHabitStore.setState({ error: "previous error" });
      await useHabitStore.getState().addHabit(baseHabit);
      expect(useHabitStore.getState().error).toBeNull();
    });
  });
});
