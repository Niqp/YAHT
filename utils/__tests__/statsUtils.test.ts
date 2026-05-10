import dayjs from "dayjs";
import { calculateHabitStats, calculateOverallStats, generateChartData } from "@/utils/statsUtils";
import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";

const stamp = (daysAgo: number) => dayjs().subtract(daysAgo, "day").format("YYYY-MM-DD");

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Test",
    icon: "🧪",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: stamp(30),
    ...overrides,
  };
}

describe("calculateOverallStats", () => {
  it("returns all-zero stats for an empty habit map", () => {
    expect(calculateOverallStats({})).toEqual({
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
  });

  it("counts active habits, due today, the recent completion window, and all time", () => {
    const today = stamp(0);
    const threeDaysAgo = stamp(3);
    const yesterday = stamp(1);
    const habits: HabitMap = {
      h1: makeHabit({
        id: "h1",
        createdAt: threeDaysAgo,
        completionHistory: {
          [threeDaysAgo]: { isCompleted: true },
          [yesterday]: { isCompleted: true },
          [today]: { isCompleted: true },
        },
      }),
      h2: makeHabit({
        id: "h2",
        createdAt: yesterday,
      }),
    };

    const stats = calculateOverallStats(habits);

    expect(stats.activeHabits).toBe(2);
    expect(stats.dueToday).toBe(2);
    expect(stats.completedToday).toBe(1);
    expect(stats.todayAdherence).toBe(50);
    expect(stats.dueLast7Days).toBe(6);
    expect(stats.completedLast7Days).toBe(3);
    expect(stats.last7DayAdherence).toBe(50);
    expect(stats.dueAllTime).toBe(6);
    expect(stats.completedAllTime).toBe(3);
    expect(stats.allTimeAdherence).toBe(50);
  });

  it("returns 0 last7DayAdherence when nothing was due in the last seven days", () => {
    const habits: HabitMap = {
      h1: makeHabit({
        id: "h1",
        createdAt: dayjs().add(2, "day").format("YYYY-MM-DD"),
      }),
    };

    expect(calculateOverallStats(habits).last7DayAdherence).toBe(0);
  });
});

describe("calculateHabitStats", () => {
  it("returns zeroed stats for an empty habit", () => {
    const stats = calculateHabitStats(makeHabit({ createdAt: stamp(0), completionHistory: {} }));

    expect(stats).toEqual({
      dueDaysSinceCreation: 1,
      completedDueDays: 0,
      adherenceSinceCreation: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      lastCompletedDate: "",
      goalHitRate: 0,
      totalRepetitions: 0,
      totalTimeSpent: 0,
      bestDayValue: 0,
    });
  });

  it("uses due days for adherence and streaks on simple habits", () => {
    const stats = calculateHabitStats(
      makeHabit({
        createdAt: stamp(3),
        completionHistory: {
          [stamp(3)]: { isCompleted: true },
          [stamp(2)]: { isCompleted: true },
          [stamp(0)]: { isCompleted: true },
        },
      })
    );

    expect(stats.dueDaysSinceCreation).toBe(4);
    expect(stats.completedDueDays).toBe(3);
    expect(stats.adherenceSinceCreation).toBe(75);
    expect(stats.currentStreak).toBe(1);
    expect(stats.bestStreak).toBe(2);
    expect(stats.totalCompletions).toBe(3);
    expect(stats.lastCompletedDate).toBe(stamp(0));
  });

  it("counts missed due days as goal misses for repetition habits", () => {
    const stats = calculateHabitStats(
      makeHabit({
        completion: { type: CompletionType.REPETITIONS, goal: 10 },
        createdAt: stamp(2),
        completionHistory: {
          [stamp(2)]: { isCompleted: true, value: 10 },
          [stamp(0)]: { isCompleted: false, value: 4 },
        },
      })
    );

    expect(stats.dueDaysSinceCreation).toBe(3);
    expect(stats.completedDueDays).toBe(1);
    expect(stats.goalHitRate).toBe(33);
    expect(stats.totalRepetitions).toBe(14);
    expect(stats.bestDayValue).toBe(10);
  });

  it("tracks total time and best day for timed habits", () => {
    const stats = calculateHabitStats(
      makeHabit({
        completion: { type: CompletionType.TIMED, goal: 60_000 },
        createdAt: stamp(1),
        completionHistory: {
          [stamp(1)]: { isCompleted: true, value: 120_000 },
          [stamp(0)]: { isCompleted: false, value: 30_000 },
        },
      })
    );

    expect(stats.totalTimeSpent).toBe(150_000);
    expect(stats.bestDayValue).toBe(120_000);
    expect(stats.goalHitRate).toBe(50);
  });
});

describe("generateChartData", () => {
  it("returns seven chart days", () => {
    expect(generateChartData(makeHabit()).days).toHaveLength(7);
  });

  it("marks pre-creation days as skipped instead of zero-value due days", () => {
    const today = stamp(0);
    const chart = generateChartData(
      makeHabit({
        createdAt: today,
        completionHistory: {
          [today]: { isCompleted: true },
        },
      })
    );

    expect(chart.days.slice(0, 6).every((day) => day.isDue === false)).toBe(true);
    expect(chart.days.at(-1)).toMatchObject({
      date: today,
      isDue: true,
      isCompleted: true,
      value: 1,
    });
  });

  it("keeps raw value data for repetition and timed habits", () => {
    const chart = generateChartData(
      makeHabit({
        completion: { type: CompletionType.REPETITIONS, goal: 10 },
        createdAt: stamp(0),
        completionHistory: {
          [stamp(0)]: { isCompleted: false, value: 7 },
        },
      })
    );

    expect(chart.days.at(-1)).toMatchObject({
      isDue: true,
      value: 7,
      goal: 10,
    });
  });
});
