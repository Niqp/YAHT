import { renderHook } from "@testing-library/react-native";
import { useHabitProgress } from "@/hooks/habit/useHabitProgress";
import { CompletionType, RepetitionType, Habit } from "@/types/habit";

const baseHabit: Habit = {
  id: "h1",
  title: "Habit",
  icon: "*",
  repetition: { type: RepetitionType.DAILY },
  completion: { type: CompletionType.TIMED, goal: 10_000 },
  completionHistory: {},
  createdAt: "2026-01-01",
};

describe("useHabitProgress", () => {
  it("includes stored completion and elapsed time for active timed habits", () => {
    const { result } = renderHook(() =>
      useHabitProgress({
        habit: baseHabit,
        isCompleted: false,
        completionValue: 4_000,
        completionGoal: 10_000,
        isTimerActive: true,
        elapsedTime: 1_000,
      })
    );

    expect(result.current).toBe(50);
  });

  it("uses stored value for timed habits when timer is not active", () => {
    const { result } = renderHook(() =>
      useHabitProgress({
        habit: baseHabit,
        isCompleted: false,
        completionValue: 4_000,
        completionGoal: 10_000,
        isTimerActive: false,
        elapsedTime: 5_000,
      })
    );

    expect(result.current).toBe(40);
  });
});
