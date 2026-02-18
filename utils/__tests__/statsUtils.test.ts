/**
 * Dedicated tests for utils/statsUtils.ts
 *
 * Focuses on branches not already covered by completionHistory.test.ts:
 * - calculateOverallStats: multi-habit streak logic, completion rate
 * - calculateHabitStats: repetition stats, timed stats, completionSinceCreation
 * - generateChartData: simple vs repetition/timed data shape
 */

import { calculateOverallStats, calculateHabitStats, generateChartData } from "@/utils/statsUtils";
import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";
import dayjs from "dayjs";

// ── Fixture helpers ───────────────────────────────────────────────────────────

function stamp(daysAgo: number): string {
  return dayjs().subtract(daysAgo, "day").format("YYYY-MM-DD");
}

const TODAY = stamp(0);

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

// ── calculateOverallStats ─────────────────────────────────────────────────────

describe("calculateOverallStats", () => {
  it("returns all-zero stats for an empty habit map", () => {
    const stats = calculateOverallStats({});
    expect(stats.totalHabits).toBe(0);
    expect(stats.completedToday).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
  });

  it("counts total habits correctly", () => {
    const map: HabitMap = {
      h1: makeHabit({ id: "h1" }),
      h2: makeHabit({ id: "h2" }),
      h3: makeHabit({ id: "h3" }),
    };
    expect(calculateOverallStats(map).totalHabits).toBe(3);
  });

  it("counts completedToday correctly", () => {
    const map: HabitMap = {
      h1: makeHabit({ id: "h1", completionHistory: { [TODAY]: { isCompleted: true } } }),
      h2: makeHabit({ id: "h2", completionHistory: { [TODAY]: { isCompleted: false } } }),
      h3: makeHabit({ id: "h3", completionHistory: {} }),
    };
    expect(calculateOverallStats(map).completedToday).toBe(1);
  });

  it("returns 0 completionRate when no habits were scheduled in last 7 days", () => {
    // Habit created in the future — shouldShowHabitOnDate will return false for all past dates
    const map: HabitMap = {
      h1: makeHabit({
        id: "h1",
        createdAt: dayjs().add(5, "day").format("YYYY-MM-DD"),
        completionHistory: {},
      }),
    };
    expect(calculateOverallStats(map).completionRate).toBe(0);
  });
});

// ── calculateHabitStats ───────────────────────────────────────────────────────

describe("calculateHabitStats", () => {
  describe("empty history", () => {
    it("returns all-zero stats", () => {
      const stats = calculateHabitStats(makeHabit({ completionHistory: {} }));
      expect(stats.totalCompletions).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.bestStreak).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.completionSinceCreation).toBe(0);
    });
  });

  describe("SIMPLE habit", () => {
    it("calculates totalCompletions and completionRate", () => {
      const history = {
        [stamp(2)]: { isCompleted: true },
        [stamp(1)]: { isCompleted: true },
        [stamp(0)]: { isCompleted: false },
      };
      const stats = calculateHabitStats(makeHabit({ completionHistory: history }));
      expect(stats.totalCompletions).toBe(2);
      expect(stats.completionRate).toBe(67); // 2/3 rounded
    });

    it("calculates currentStreak from consecutive completions (newest first)", () => {
      const history = {
        [stamp(3)]: { isCompleted: false },
        [stamp(2)]: { isCompleted: true },
        [stamp(1)]: { isCompleted: true },
        [stamp(0)]: { isCompleted: true },
      };
      const stats = calculateHabitStats(makeHabit({ completionHistory: history }));
      expect(stats.currentStreak).toBe(3);
      expect(stats.bestStreak).toBe(3);
    });

    it("sets bestStreak to the longest run even if broken", () => {
      const history = {
        [stamp(5)]: { isCompleted: true },
        [stamp(4)]: { isCompleted: true },
        [stamp(3)]: { isCompleted: false },
        [stamp(2)]: { isCompleted: true },
        [stamp(1)]: { isCompleted: true },
        [stamp(0)]: { isCompleted: true },
      };
      const stats = calculateHabitStats(makeHabit({ completionHistory: history }));
      expect(stats.bestStreak).toBeGreaterThanOrEqual(2);
    });

    it("calculates completionSinceCreation as a percentage", () => {
      const createdAt = stamp(3); // 4 days ago (including today)
      const history = {
        [stamp(3)]: { isCompleted: true },
        [stamp(2)]: { isCompleted: true },
      };
      const stats = calculateHabitStats(makeHabit({ createdAt, completionHistory: history }));
      // 2 completed out of 4 days = 50%
      expect(stats.completionSinceCreation).toBe(50);
    });

    it("clamps completionSinceCreation to 100", () => {
      // Created today, completed today
      const history = { [TODAY]: { isCompleted: true } };
      const stats = calculateHabitStats(makeHabit({ createdAt: TODAY, completionHistory: history }));
      expect(stats.completionSinceCreation).toBeLessThanOrEqual(100);
      expect(stats.completionSinceCreation).toBeGreaterThanOrEqual(0);
    });
  });

  describe("REPETITIONS habit", () => {
    function makeRepHabit(history: Habit["completionHistory"]): Habit {
      return makeHabit({
        completion: { type: CompletionType.REPETITIONS, goal: 10 },
        completionHistory: history,
      });
    }

    it("calculates totalRepetitions, averageRepetitions, bestRepetitions", () => {
      const history = {
        [stamp(2)]: { isCompleted: true, value: 5 },
        [stamp(1)]: { isCompleted: true, value: 8 },
        [stamp(0)]: { isCompleted: false, value: 3 },
      };
      const stats = calculateHabitStats(makeRepHabit(history));
      expect(stats.totalRepetitions).toBe(16);
      expect(stats.bestRepetitions).toBe(8);
      expect(stats.averageRepetitions).toBeCloseTo(16 / 3, 0);
    });

    it("calculates goalAchievementRate", () => {
      const history = {
        [stamp(1)]: { isCompleted: true, value: 10 }, // reached goal
        [stamp(0)]: { isCompleted: false, value: 4 }, // did not reach goal
      };
      const stats = calculateHabitStats(makeRepHabit(history));
      expect(stats.goalAchievementRate).toBe(50); // 1/2
    });
  });

  describe("TIMED habit", () => {
    function makeTimedHabit(history: Habit["completionHistory"]): Habit {
      return makeHabit({
        completion: { type: CompletionType.TIMED, goal: 10_000 },
        completionHistory: history,
      });
    }

    it("calculates totalTimeSpent, averageTimePerSession, longestSession", () => {
      const history = {
        [stamp(2)]: { isCompleted: true, value: 5_000 },
        [stamp(1)]: { isCompleted: true, value: 8_000 },
        [stamp(0)]: { isCompleted: false, value: 3_000 },
      };
      const stats = calculateHabitStats(makeTimedHabit(history));
      expect(stats.totalTimeSpent).toBe(16_000);
      expect(stats.longestSession).toBe(8_000);
      expect(stats.averageTimePerSession).toBe(Math.round(16_000 / 3));
    });

    it("calculates goalAchievementRate for timed habits", () => {
      const history = {
        [stamp(1)]: { isCompleted: true, value: 10_000 }, // reached goal
        [stamp(0)]: { isCompleted: false, value: 4_000 }, // did not reach goal
      };
      const stats = calculateHabitStats(makeTimedHabit(history));
      expect(stats.goalAchievementRate).toBe(50);
    });
  });
});

// ── generateChartData ─────────────────────────────────────────────────────────

describe("generateChartData", () => {
  it("returns 7 labels and 7 data points", () => {
    const chart = generateChartData(makeHabit());
    expect(chart.labels).toHaveLength(7);
    expect(chart.datasets[0].data).toHaveLength(7);
  });

  it("returns binary (0/1) data for SIMPLE habits", () => {
    const history = { [TODAY]: { isCompleted: true } };
    const chart = generateChartData(makeHabit({ completionHistory: history }));
    const values = chart.datasets[0].data;
    expect(values.every((v) => v === 0 || v === 1)).toBe(true);
    expect(values[6]).toBe(1); // today is the last element
  });

  it("returns value data for REPETITIONS habits", () => {
    const history = { [TODAY]: { isCompleted: true, value: 7 } };
    const habit = makeHabit({
      completion: { type: CompletionType.REPETITIONS, goal: 10 },
      completionHistory: history,
    });
    const chart = generateChartData(habit);
    expect(chart.datasets[0].data[6]).toBe(7);
  });

  it("returns value data for TIMED habits", () => {
    const history = { [TODAY]: { isCompleted: true, value: 5_000 } };
    const habit = makeHabit({
      completion: { type: CompletionType.TIMED, goal: 10_000 },
      completionHistory: history,
    });
    const chart = generateChartData(habit);
    expect(chart.datasets[0].data[6]).toBe(5_000);
  });

  it("returns 0 for days with no history entry", () => {
    const chart = generateChartData(makeHabit({ completionHistory: {} }));
    expect(chart.datasets[0].data.every((v) => v === 0)).toBe(true);
  });
});
