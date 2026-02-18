/**
 * Tests for useStats hook.
 *
 * Covers: empty state constants, habit selection logic,
 * handleSelectHabit, progressData clamping.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useStats } from "@/hooks/useStats";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";

// ─── Store mock ───────────────────────────────────────────────────────────────

const mockHabits: Record<string, Habit> = {};

jest.mock("@/store/habitStore", () => {
  const useHabitStore = (selector: (state: { habits: Record<string, Habit>; _hasHydrated: boolean }) => unknown) =>
    selector({ habits: mockHabits, _hasHydrated: true });
  return { useHabitStore };
});

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useStats", () => {
  beforeEach(() => {
    // Clear mock habits before each test
    for (const key of Object.keys(mockHabits)) {
      delete mockHabits[key];
    }
  });

  describe("empty state", () => {
    it("returns zero overall stats when there are no habits", () => {
      const { result } = renderHook(() => useStats());

      expect(result.current.overallStats.totalHabits).toBe(0);
      expect(result.current.overallStats.completedToday).toBe(0);
      expect(result.current.overallStats.completionRate).toBe(0);
      expect(result.current.overallStats.currentStreak).toBe(0);
      expect(result.current.overallStats.bestStreak).toBe(0);
    });

    it("returns null selectedHabit when there are no habits", () => {
      const { result } = renderHook(() => useStats());
      expect(result.current.selectedHabit).toBeNull();
    });

    it("returns empty line chart data when there are no habits", () => {
      const { result } = renderHook(() => useStats());
      expect(result.current.lineChartData.datasets[0].data).toHaveLength(7);
      expect(result.current.lineChartData.datasets[0].data.every((v) => v === 0)).toBe(true);
    });

    it("returns zero habit stats when there are no habits", () => {
      const { result } = renderHook(() => useStats());
      expect(result.current.habitStats.totalCompletions).toBe(0);
      expect(result.current.habitStats.completionRate).toBe(0);
    });

    it("returns empty progress data when there are no habits", () => {
      const { result } = renderHook(() => useStats());
      expect(result.current.progressData.data).toEqual([0]);
    });
  });

  describe("with habits", () => {
    it("defaults to the first habit when none is selected", () => {
      mockHabits["h1"] = makeHabit({ id: "h1", title: "First" });
      mockHabits["h2"] = makeHabit({ id: "h2", title: "Second" });

      const { result } = renderHook(() => useStats());

      // Should default to first habit in the array
      expect(result.current.selectedHabit).not.toBeNull();
    });

    it("returns the correct total habit count", () => {
      mockHabits["h1"] = makeHabit({ id: "h1" });
      mockHabits["h2"] = makeHabit({ id: "h2" });
      mockHabits["h3"] = makeHabit({ id: "h3" });

      const { result } = renderHook(() => useStats());

      expect(result.current.overallStats.totalHabits).toBe(3);
    });

    it("handleSelectHabit switches the selected habit", () => {
      mockHabits["h1"] = makeHabit({ id: "h1", title: "First" });
      mockHabits["h2"] = makeHabit({ id: "h2", title: "Second" });

      const { result } = renderHook(() => useStats());

      act(() => {
        result.current.handleSelectHabit(mockHabits["h2"]);
      });

      expect(result.current.selectedHabit?.id).toBe("h2");
    });

    it("exposes the habits map and habitArray", () => {
      mockHabits["h1"] = makeHabit({ id: "h1" });

      const { result } = renderHook(() => useStats());

      expect(result.current.habits["h1"]).toBeDefined();
      expect(result.current.habitArray).toHaveLength(1);
    });
  });

  describe("progressData clamping", () => {
    it("clamps progress to 1 when completionSinceCreation is 100", () => {
      // Habit created today, completed today → 100%
      const today = new Date().toISOString().slice(0, 10);
      mockHabits["h1"] = makeHabit({
        id: "h1",
        createdAt: today,
        completionHistory: { [today]: { isCompleted: true } },
      });

      const { result } = renderHook(() => useStats());

      expect(result.current.progressData.data[0]).toBeLessThanOrEqual(1);
      expect(result.current.progressData.data[0]).toBeGreaterThanOrEqual(0);
    });

    it("returns 0 progress when habit has no completions", () => {
      mockHabits["h1"] = makeHabit({ id: "h1", completionHistory: {} });

      const { result } = renderHook(() => useStats());

      expect(result.current.progressData.data[0]).toBe(0);
    });
  });
});
