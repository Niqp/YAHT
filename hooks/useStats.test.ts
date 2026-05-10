import { act, renderHook } from "@testing-library/react-native";
import dayjs from "dayjs";
import { useStats } from "@/hooks/useStats";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";

const mockHabits: Record<string, Habit> = {};

jest.mock("@/store/habitStore", () => {
  const useHabitStore = (selector: (state: { habits: Record<string, Habit>; _hasHydrated: boolean }) => unknown) =>
    selector({ habits: mockHabits, _hasHydrated: true });
  return { useHabitStore };
});

const stamp = (daysAgo: number) => dayjs().subtract(daysAgo, "day").format("YYYY-MM-DD");

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Test Habit",
    icon: "🧪",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: stamp(30),
    ...overrides,
  };
}

describe("useStats", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockHabits)) {
      delete mockHabits[key];
    }
  });

  it("returns zeroed state when there are no habits", () => {
    const { result } = renderHook(() => useStats());

    expect(result.current.selectedHabit).toBeNull();
    expect(result.current.overallStats).toEqual({
      activeHabits: 0,
      dueToday: 0,
      completedToday: 0,
      todayAdherence: 0,
      dueLast7Days: 0,
      completedLast7Days: 0,
      last7DayAdherence: 0,
      dueAllTime: 0,
      completedAllTime: 0,
      allTimeAdherence: 0,
    });
    expect(result.current.chartData.days).toEqual([]);
    expect(result.current.habitStats.adherenceSinceCreation).toBe(0);
  });

  it("defaults to the first habit when none is selected", () => {
    mockHabits["h1"] = makeHabit({ id: "h1", title: "First" });
    mockHabits["h2"] = makeHabit({ id: "h2", title: "Second" });

    const { result } = renderHook(() => useStats());

    expect(result.current.selectedHabit?.id).toBe("h1");
  });

  it("switches the selected habit", () => {
    mockHabits["h1"] = makeHabit({ id: "h1", title: "First" });
    mockHabits["h2"] = makeHabit({ id: "h2", title: "Second" });

    const { result } = renderHook(() => useStats());

    act(() => {
      result.current.handleSelectHabit(mockHabits["h2"]);
    });

    expect(result.current.selectedHabit?.id).toBe("h2");
  });

  it("exposes the habits map and chart data for the selected habit", () => {
    const today = stamp(0);
    mockHabits["h1"] = makeHabit({
      id: "h1",
      createdAt: today,
      completionHistory: {
        [today]: { isCompleted: true },
      },
    });

    const { result } = renderHook(() => useStats());

    expect(result.current.habits["h1"]).toBeDefined();
    expect(result.current.habitArray).toHaveLength(1);
    expect(result.current.overallStats.activeHabits).toBe(1);
    expect(result.current.overallStats.completedLast7Days).toBe(1);
    expect(result.current.habitStats.adherenceSinceCreation).toBe(100);
    expect(result.current.chartData.days).toHaveLength(7);
    expect(result.current.chartData.days.at(-1)).toMatchObject({
      date: today,
      isDue: true,
      isCompleted: true,
      value: 1,
    });
  });

  it("computes schedule-aware stats for repetition habits", () => {
    mockHabits["h1"] = makeHabit({
      id: "h1",
      completion: { type: CompletionType.REPETITIONS, goal: 10 },
      createdAt: stamp(2),
      completionHistory: {
        [stamp(2)]: { isCompleted: true, value: 10 },
        [stamp(0)]: { isCompleted: false, value: 4 },
      },
    });

    const { result } = renderHook(() => useStats());

    expect(result.current.habitStats.completedDueDays).toBe(1);
    expect(result.current.habitStats.dueDaysSinceCreation).toBe(3);
    expect(result.current.habitStats.goalHitRate).toBe(33);
    expect(result.current.habitStats.totalRepetitions).toBe(14);
  });
});
