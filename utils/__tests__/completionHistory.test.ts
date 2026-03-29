import { CompletionType, RepetitionType, type CompletionHistory, type Habit } from "@/types/habit";
import { isHabitDueOnDate, shouldShowHabitOnDate } from "@/utils/date";

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

function buildHistory(entries: [string, CompletionHistory][]): Record<string, CompletionHistory> {
  const record: Record<string, CompletionHistory> = {};
  for (const [date, entry] of entries) {
    record[date] = entry;
  }
  return record;
}

describe("shouldShowHabitOnDate", () => {
  it("returns false for null or empty inputs", () => {
    expect(shouldShowHabitOnDate(null as unknown as Habit, "2026-01-15")).toBe(false);
    expect(shouldShowHabitOnDate(makeHabit(), "")).toBe(false);
  });

  it("shows daily habits on or after creation", () => {
    const habit = makeHabit({ createdAt: "2026-01-01" });
    expect(shouldShowHabitOnDate(habit, "2026-01-01")).toBe(true);
    expect(shouldShowHabitOnDate(habit, "2026-01-20")).toBe(true);
  });

  it("hides habits before creation unless that date is already completed", () => {
    const hiddenHabit = makeHabit({ createdAt: "2026-03-01" });
    expect(shouldShowHabitOnDate(hiddenHabit, "2026-02-28")).toBe(false);

    const completedHabit = makeHabit({
      createdAt: "2026-03-01",
      completionHistory: buildHistory([["2026-02-28", { isCompleted: true }]]),
    });
    expect(shouldShowHabitOnDate(completedHabit, "2026-02-28")).toBe(true);
  });

  it("shows weekday habits only on scheduled days", () => {
    const habit = makeHabit({
      repetition: { type: RepetitionType.WEEKDAYS, days: [1, 3, 5] },
    });

    expect(shouldShowHabitOnDate(habit, "2026-02-16")).toBe(true);
    expect(shouldShowHabitOnDate(habit, "2026-02-14")).toBe(false);
  });

  it("uses only historical completions when evaluating interval due dates", () => {
    const habit = makeHabit({
      repetition: { type: RepetitionType.INTERVAL, days: 3 },
      createdAt: "2026-01-01",
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-10", { isCompleted: true }],
      ]),
    });

    expect(isHabitDueOnDate(habit, "2026-01-05")).toBe(true);
    expect(shouldShowHabitOnDate(habit, "2026-01-05")).toBe(true);
    expect(isHabitDueOnDate(habit, "2026-01-12")).toBe(false);
    expect(isHabitDueOnDate(habit, "2026-01-13")).toBe(true);
  });
});

describe("completionHistory key ordering", () => {
  it("preserves insertion order for Object.keys", () => {
    const history = buildHistory([
      ["2026-01-01", { isCompleted: true }],
      ["2026-01-02", { isCompleted: false }],
      ["2026-01-03", { isCompleted: true }],
    ]);

    expect(Object.keys(history)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("can be sorted lexicographically as chronological dates", () => {
    const history: Record<string, CompletionHistory> = {};
    history["2026-01-03"] = { isCompleted: true };
    history["2026-01-01"] = { isCompleted: true };
    history["2026-01-02"] = { isCompleted: false };

    expect(Object.keys(history).sort()).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });
});

describe("record serialization", () => {
  it("round-trips a completion history record through JSON", () => {
    const original = buildHistory([
      ["2026-01-01", { isCompleted: true, value: 5 }],
      ["2026-01-02", { isCompleted: false }],
    ]);

    const parsed = JSON.parse(JSON.stringify(original)) as Record<string, CompletionHistory>;

    expect(parsed["2026-01-01"]).toEqual({ isCompleted: true, value: 5 });
    expect(parsed["2026-01-02"]).toEqual({ isCompleted: false });
  });

  it("preserves key order through a JSON round-trip", () => {
    const original = buildHistory([
      ["2026-01-03", { isCompleted: true }],
      ["2026-01-01", { isCompleted: true }],
      ["2026-01-02", { isCompleted: false }],
    ]);

    expect(Object.keys(JSON.parse(JSON.stringify(original)))).toEqual(["2026-01-03", "2026-01-01", "2026-01-02"]);
  });
});
