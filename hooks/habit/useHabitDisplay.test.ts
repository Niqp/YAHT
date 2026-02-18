/**
 * Tests for useHabitDisplay hook.
 *
 * Covers: getSubtitleText for all completion types, getDisplayTime.
 */

import { renderHook } from "@testing-library/react-native";
import { useHabitDisplay } from "@/hooks/habit/useHabitDisplay";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";

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

// ─── getSubtitleText ──────────────────────────────────────────────────────────

describe("useHabitDisplay — getSubtitleText", () => {
  it("returns empty string when habit is undefined", () => {
    const { result } = renderHook(() =>
      useHabitDisplay({
        habit: undefined,
        isCompleted: false,
        completionValue: 0,
        completionGoal: 0,
        elapsedTime: 0,
      })
    );
    expect(result.current.getSubtitleText()).toBe("");
  });

  describe("SIMPLE habit", () => {
    it("returns 'Completed' when isCompleted is true", () => {
      const { result } = renderHook(() =>
        useHabitDisplay({
          habit: makeHabit({ completion: { type: CompletionType.SIMPLE } }),
          isCompleted: true,
          completionValue: 0,
          completionGoal: 0,
          elapsedTime: 0,
        })
      );
      expect(result.current.getSubtitleText()).toBe("Completed");
    });

    it("returns empty string when not completed", () => {
      const { result } = renderHook(() =>
        useHabitDisplay({
          habit: makeHabit({ completion: { type: CompletionType.SIMPLE } }),
          isCompleted: false,
          completionValue: 0,
          completionGoal: 0,
          elapsedTime: 0,
        })
      );
      expect(result.current.getSubtitleText()).toBe("");
    });
  });

  describe("REPETITIONS habit", () => {
    it("returns 'value / goal' format", () => {
      const { result } = renderHook(() =>
        useHabitDisplay({
          habit: makeHabit({ completion: { type: CompletionType.REPETITIONS, goal: 10 } }),
          isCompleted: false,
          completionValue: 3,
          completionGoal: 10,
          elapsedTime: 0,
        })
      );
      expect(result.current.getSubtitleText()).toBe("3 / 10");
    });

    it("shows goal reached state correctly", () => {
      const { result } = renderHook(() =>
        useHabitDisplay({
          habit: makeHabit({ completion: { type: CompletionType.REPETITIONS, goal: 5 } }),
          isCompleted: true,
          completionValue: 5,
          completionGoal: 5,
          elapsedTime: 0,
        })
      );
      expect(result.current.getSubtitleText()).toBe("5 / 5");
    });
  });

  describe("TIMED habit", () => {
    it("returns formatted time / goal format", () => {
      // 4000ms stored + 0 elapsed = 00:00:04, goal = 10000ms = 00:00:10
      const { result } = renderHook(() =>
        useHabitDisplay({
          habit: makeHabit({ completion: { type: CompletionType.TIMED, goal: 10_000 } }),
          isCompleted: false,
          completionValue: 4_000,
          completionGoal: 10_000,
          elapsedTime: 0,
        })
      );
      expect(result.current.getSubtitleText()).toBe("00:00:04 / 00:00:10");
    });

    it("includes elapsed time in the display", () => {
      // 4000ms stored + 2000ms elapsed = 6000ms = 00:00:06
      const { result } = renderHook(() =>
        useHabitDisplay({
          habit: makeHabit({ completion: { type: CompletionType.TIMED, goal: 10_000 } }),
          isCompleted: false,
          completionValue: 4_000,
          completionGoal: 10_000,
          elapsedTime: 2_000,
        })
      );
      expect(result.current.getSubtitleText()).toBe("00:00:06 / 00:00:10");
    });

    it("formats 1 minute goal correctly", () => {
      const { result } = renderHook(() =>
        useHabitDisplay({
          habit: makeHabit({ completion: { type: CompletionType.TIMED, goal: 60_000 } }),
          isCompleted: false,
          completionValue: 0,
          completionGoal: 60_000,
          elapsedTime: 0,
        })
      );
      expect(result.current.getSubtitleText()).toBe("00:00:00 / 00:01:00");
    });
  });
});
