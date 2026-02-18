/**
 * Tests for completionHistory-related functionality.
 *
 * These tests verify the behavior of utils that operate on completionHistory.
 *
 * Key behaviors validated:
 * - Stats computation (overall and per-habit)
 * - Chart data generation
 * - Date-based habit visibility (shouldShowHabitOnDate)
 * - Key ordering after sorted insertion
 */

import { Habit, CompletionType, RepetitionType, CompletionHistory } from "@/types/habit";
import { calculateOverallStats, calculateHabitStats, generateChartData } from "@/utils/statsUtils";
import { shouldShowHabitOnDate } from "@/utils/date";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a minimal habit for testing with a Record-based completionHistory.
 */
function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "test-habit-1",
    title: "Test Habit",
    icon: "🧪",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: "2026-01-01",
    ...overrides,
  };
}

/**
 * Build a completionHistory Record from an array of [date, entry] tuples.
 * Keys are inserted in the order provided.
 */
function buildHistory(entries: [string, CompletionHistory][]): Record<string, CompletionHistory> {
  const record: Record<string, CompletionHistory> = {};
  for (const [date, entry] of entries) {
    record[date] = entry;
  }
  return record;
}

// ─── shouldShowHabitOnDate ────────────────────────────────────────────────────

describe("shouldShowHabitOnDate", () => {
  it("returns false for null/undefined inputs", () => {
    expect(shouldShowHabitOnDate(null as unknown as Habit, "2026-01-15")).toBe(false);
    expect(shouldShowHabitOnDate(makeHabit(), "")).toBe(false);
  });

  it("shows a daily habit on any date at or after creation", () => {
    const habit = makeHabit({ createdAt: "2026-01-01" });
    expect(shouldShowHabitOnDate(habit, "2026-01-01")).toBe(true);
    expect(shouldShowHabitOnDate(habit, "2026-06-15")).toBe(true);
  });

  it("hides a habit before its creation date", () => {
    const habit = makeHabit({ createdAt: "2026-03-01" });
    expect(shouldShowHabitOnDate(habit, "2026-02-28")).toBe(false);
  });

  it("shows a completed habit even before creation date", () => {
    const habit = makeHabit({
      createdAt: "2026-03-01",
      completionHistory: buildHistory([["2026-02-28", { isCompleted: true }]]),
    });
    expect(shouldShowHabitOnDate(habit, "2026-02-28")).toBe(true);
  });

  it("shows a weekday habit only on its scheduled days", () => {
    // 2026-02-14 is a Saturday (day 6)
    // 2026-02-16 is a Monday (day 1)
    const habit = makeHabit({
      createdAt: "2026-01-01",
      repetition: { type: RepetitionType.WEEKDAYS, days: [1, 3, 5] }, // Mon, Wed, Fri
    });
    expect(shouldShowHabitOnDate(habit, "2026-02-16")).toBe(true); // Monday
    expect(shouldShowHabitOnDate(habit, "2026-02-14")).toBe(false); // Saturday
  });

  it("shows an interval habit on creation day", () => {
    const habit = makeHabit({
      createdAt: "2026-01-10",
      repetition: { type: RepetitionType.INTERVAL, days: 3 },
    });
    expect(shouldShowHabitOnDate(habit, "2026-01-10")).toBe(true);
  });

  it("shows an interval habit N days after last history entry", () => {
    const habit = makeHabit({
      createdAt: "2026-01-01",
      repetition: { type: RepetitionType.INTERVAL, days: 3 },
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-04", { isCompleted: true }],
      ]),
    });
    // Last entry is 2026-01-04, next due = 2026-01-07
    expect(shouldShowHabitOnDate(habit, "2026-01-06")).toBe(false);
    expect(shouldShowHabitOnDate(habit, "2026-01-07")).toBe(true);
    expect(shouldShowHabitOnDate(habit, "2026-01-10")).toBe(true); // past due also shows
  });
});

// ─── Object.keys ordering for completionHistory ──────────────────────────────

describe("completionHistory key ordering", () => {
  it("Object.keys preserves insertion order", () => {
    const history = buildHistory([
      ["2026-01-01", { isCompleted: true }],
      ["2026-01-02", { isCompleted: false }],
      ["2026-01-03", { isCompleted: true }],
    ]);
    expect(Object.keys(history)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("Object.keys of unordered insertions can be sorted", () => {
    const history: Record<string, CompletionHistory> = {};
    history["2026-01-03"] = { isCompleted: true };
    history["2026-01-01"] = { isCompleted: true };
    history["2026-01-02"] = { isCompleted: false };

    const sorted = Object.keys(history).sort();
    expect(sorted).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("YYYY-MM-DD strings sort lexicographically the same as chronologically", () => {
    const dates = ["2026-12-31", "2026-01-01", "2026-06-15", "2025-12-01"];
    const sorted = [...dates].sort();
    expect(sorted).toEqual(["2025-12-01", "2026-01-01", "2026-06-15", "2026-12-31"]);
  });
});

// ─── calculateHabitStats ─────────────────────────────────────────────────────

describe("calculateHabitStats", () => {
  it("returns zeroed stats when completionHistory is empty", () => {
    const habit = makeHabit();
    const stats = calculateHabitStats(habit);
    expect(stats.totalCompletions).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
    expect(stats.lastCompletionDate).toBe("");
  });

  it("counts total completions correctly", () => {
    const habit = makeHabit({
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-02", { isCompleted: false }],
        ["2026-01-03", { isCompleted: true }],
        ["2026-01-04", { isCompleted: true }],
      ]),
    });
    const stats = calculateHabitStats(habit);
    expect(stats.totalCompletions).toBe(3);
  });

  it("calculates completion rate as percentage of entries with isCompleted", () => {
    const habit = makeHabit({
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-02", { isCompleted: false }],
        ["2026-01-03", { isCompleted: true }],
        ["2026-01-04", { isCompleted: false }],
      ]),
    });
    const stats = calculateHabitStats(habit);
    // 2 completed out of 4 = 50%
    expect(stats.completionRate).toBe(50);
  });

  it("identifies the last completion date", () => {
    const habit = makeHabit({
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-05", { isCompleted: false }],
        ["2026-01-03", { isCompleted: true }],
      ]),
    });
    const stats = calculateHabitStats(habit);
    expect(stats.lastCompletionDate).toBe("2026-01-03");
  });

  it("calculates streaks from sorted dates (newest first)", () => {
    const habit = makeHabit({
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-02", { isCompleted: true }],
        ["2026-01-03", { isCompleted: true }],
        ["2026-01-04", { isCompleted: false }],
        ["2026-01-05", { isCompleted: true }],
        ["2026-01-06", { isCompleted: true }],
      ]),
    });
    const stats = calculateHabitStats(habit);
    // Sorted newest first: 06(✓), 05(✓), 04(✗), 03(✓), 02(✓), 01(✓)
    // Current streak from newest: 2
    // Best streak: 3 (01-02-03)
    expect(stats.currentStreak).toBe(2);
    expect(stats.bestStreak).toBe(3);
  });

  it("handles an ongoing streak (never broken)", () => {
    const habit = makeHabit({
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-02", { isCompleted: true }],
        ["2026-01-03", { isCompleted: true }],
      ]),
    });
    const stats = calculateHabitStats(habit);
    expect(stats.currentStreak).toBe(3);
    expect(stats.bestStreak).toBe(3);
  });

  describe("repetition habit stats", () => {
    it("calculates average, best, total repetitions and goal achievement rate", () => {
      const habit = makeHabit({
        completion: { type: CompletionType.REPETITIONS, goal: 10 },
        completionHistory: buildHistory([
          ["2026-01-01", { isCompleted: true, value: 12 }],
          ["2026-01-02", { isCompleted: false, value: 5 }],
          ["2026-01-03", { isCompleted: true, value: 10 }],
        ]),
      });
      const stats = calculateHabitStats(habit);
      expect(stats.totalRepetitions).toBe(27); // 12 + 5 + 10
      expect(stats.averageRepetitions).toBe(9); // 27 / 3 = 9.0
      expect(stats.bestRepetitions).toBe(12);
      // Goal (10) reached on 2 out of 3 dates
      expect(stats.goalAchievementRate).toBe(67); // Math.round(2/3 * 100)
    });
  });

  describe("timed habit stats", () => {
    it("calculates time-based stats", () => {
      const habit = makeHabit({
        completion: { type: CompletionType.TIMED, goal: 60000 }, // 1 min goal
        completionHistory: buildHistory([
          ["2026-01-01", { isCompleted: true, value: 90000 }],
          ["2026-01-02", { isCompleted: false, value: 30000 }],
          ["2026-01-03", { isCompleted: true, value: 60000 }],
        ]),
      });
      const stats = calculateHabitStats(habit);
      expect(stats.totalTimeSpent).toBe(180000); // 90k + 30k + 60k
      expect(stats.averageTimePerSession).toBe(60000); // 180k / 3
      expect(stats.longestSession).toBe(90000);
      // Goal (60000) reached on dates 01 and 03 → 2 out of 3
      expect(stats.goalAchievementRate).toBe(67);
    });
  });
});

// ─── calculateOverallStats ───────────────────────────────────────────────────

describe("calculateOverallStats", () => {
  it("returns zeroed stats for empty habits map", () => {
    const stats = calculateOverallStats({});
    expect(stats.totalHabits).toBe(0);
    expect(stats.completedToday).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
  });

  it("counts total habits", () => {
    const habits = {
      h1: makeHabit({ id: "h1" }),
      h2: makeHabit({ id: "h2" }),
    };
    const stats = calculateOverallStats(habits);
    expect(stats.totalHabits).toBe(2);
  });
});

// ─── generateChartData ───────────────────────────────────────────────────────

describe("generateChartData", () => {
  it("generates 7 labels for simple habits", () => {
    const habit = makeHabit();
    const data = generateChartData(habit);
    expect(data.labels).toHaveLength(7);
    expect(data.datasets[0].data).toHaveLength(7);
  });

  it("produces binary 0/1 data for simple habits", () => {
    const habit = makeHabit();
    const data = generateChartData(habit);
    for (const val of data.datasets[0].data) {
      expect([0, 1]).toContain(val);
    }
  });

  it("generates value data for repetition habits", () => {
    const habit = makeHabit({
      completion: { type: CompletionType.REPETITIONS, goal: 10 },
    });
    const data = generateChartData(habit);
    expect(data.datasets[0].data).toHaveLength(7);
    // With empty history, all values should be 0
    expect(data.datasets[0].data.every((v) => v === 0)).toBe(true);
  });

  it("generates value data for timed habits", () => {
    const habit = makeHabit({
      completion: { type: CompletionType.TIMED, goal: 60000 },
    });
    const data = generateChartData(habit);
    expect(data.datasets[0].data).toHaveLength(7);
  });
});

// ─── Serialization behavior ──────────────────────────────────────────────────

describe("Record serialization", () => {
  it("JSON.stringify and JSON.parse round-trips a completionHistory Record", () => {
    const original = buildHistory([
      ["2026-01-01", { isCompleted: true, value: 5 }],
      ["2026-01-02", { isCompleted: false }],
    ]);

    const json = JSON.stringify(original);
    const parsed = JSON.parse(json) as Record<string, CompletionHistory>;

    expect(parsed["2026-01-01"]).toEqual({ isCompleted: true, value: 5 });
    expect(parsed["2026-01-02"]).toEqual({ isCompleted: false });
  });

  it("preserves key order through JSON round-trip", () => {
    const original = buildHistory([
      ["2026-01-03", { isCompleted: true }],
      ["2026-01-01", { isCompleted: true }],
      ["2026-01-02", { isCompleted: false }],
    ]);

    const json = JSON.stringify(original);
    const parsed = JSON.parse(json);

    // JSON preserves insertion order for string keys
    expect(Object.keys(parsed)).toEqual(["2026-01-03", "2026-01-01", "2026-01-02"]);
  });
});
