/**
 * Tests for useHabitProgress hook.
 *
 * Extends existing tests with SIMPLE and REPETITIONS branches,
 * undefined habit, and clamping behavior.
 */

import { renderHook } from "@testing-library/react-native";
import { useHabitProgress } from "@/hooks/habit/useHabitProgress";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Habit",
    icon: "*",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: "2026-01-01",
    ...overrides,
  };
}

describe("useHabitProgress", () => {
  // ── undefined habit ──────────────────────────────────────────────────────

  it("returns 0 when habit is undefined", () => {
    const { result } = renderHook(() =>
      useHabitProgress({
        habit: undefined,
        isCompleted: false,
        completionValue: 0,
        completionGoal: 10,
        isTimerActive: false,
        elapsedTime: 0,
      })
    );
    expect(result.current).toBe(0);
  });

  // ── SIMPLE habit ─────────────────────────────────────────────────────────

  describe("SIMPLE habit", () => {
    it("returns 100 when completed", () => {
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.SIMPLE } }),
          isCompleted: true,
          completionValue: 0,
          completionGoal: 0,
          isTimerActive: false,
          elapsedTime: 0,
        })
      );
      expect(result.current).toBe(100);
    });

    it("returns 0 when not completed", () => {
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.SIMPLE } }),
          isCompleted: false,
          completionValue: 0,
          completionGoal: 0,
          isTimerActive: false,
          elapsedTime: 0,
        })
      );
      expect(result.current).toBe(0);
    });
  });

  // ── REPETITIONS habit ────────────────────────────────────────────────────

  describe("REPETITIONS habit", () => {
    it("returns correct percentage based on stored value", () => {
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.REPETITIONS, goal: 10 } }),
          isCompleted: false,
          completionValue: 4,
          completionGoal: 10,
          isTimerActive: false,
          elapsedTime: 0,
        })
      );
      expect(result.current).toBe(40);
    });

    it("clamps to 100 when value exceeds goal", () => {
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.REPETITIONS, goal: 5 } }),
          isCompleted: true,
          completionValue: 8,
          completionGoal: 5,
          isTimerActive: false,
          elapsedTime: 0,
        })
      );
      expect(result.current).toBe(100);
    });

    it("returns 0 when value is 0", () => {
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.REPETITIONS, goal: 10 } }),
          isCompleted: false,
          completionValue: 0,
          completionGoal: 10,
          isTimerActive: false,
          elapsedTime: 0,
        })
      );
      expect(result.current).toBe(0);
    });
  });

  // ── TIMED habit ──────────────────────────────────────────────────────────

  describe("TIMED habit", () => {
    it("includes elapsed time when timer is active", () => {
      // 4000ms stored + 1000ms elapsed = 5000ms / 10000ms goal = 50%
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.TIMED, goal: 10_000 } }),
          isCompleted: false,
          completionValue: 4_000,
          completionGoal: 10_000,
          isTimerActive: true,
          elapsedTime: 1_000,
        })
      );
      expect(result.current).toBe(50);
    });

    it("uses only stored value when timer is not active", () => {
      // 4000ms stored / 10000ms goal = 40%
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.TIMED, goal: 10_000 } }),
          isCompleted: false,
          completionValue: 4_000,
          completionGoal: 10_000,
          isTimerActive: false,
          elapsedTime: 5_000,
        })
      );
      expect(result.current).toBe(40);
    });

    it("clamps to 100 when combined time exceeds goal", () => {
      const { result } = renderHook(() =>
        useHabitProgress({
          habit: makeHabit({ completion: { type: CompletionType.TIMED, goal: 5_000 } }),
          isCompleted: true,
          completionValue: 4_000,
          completionGoal: 5_000,
          isTimerActive: true,
          elapsedTime: 3_000,
        })
      );
      expect(result.current).toBe(100);
    });
  });
});
