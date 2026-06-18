import { CompletionType, RepetitionType, type CompletionHistory, type Habit } from "@/types/habit";
import { isHabitDueOnDate, isPrimaryDueDate, shouldShowHabitOnDate } from "@/utils/date";

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

describe("isHabitDueOnDate — monthly habits", () => {
  const makeMonthly = (months: number, createdAt: string, history: Record<string, CompletionHistory> = {}) =>
    makeHabit({
      repetition: { type: RepetitionType.MONTHLY, months },
      createdAt,
      completionHistory: history,
    });

  it("is due on the 1st of an eligible month", () => {
    const habit = makeMonthly(1, "2026-01-01");
    expect(isHabitDueOnDate(habit, "2026-02-01")).toBe(true);
    expect(isHabitDueOnDate(habit, "2026-03-01")).toBe(true);
  });

  it("is not due on non-1st days when already completed on the 1st", () => {
    const habit = makeMonthly(1, "2026-01-01", buildHistory([["2026-02-01", { isCompleted: true }]]));
    expect(isHabitDueOnDate(habit, "2026-02-02")).toBe(false);
    expect(isHabitDueOnDate(habit, "2026-02-15")).toBe(false);
  });

  it("is due on subsequent days if not completed yet", () => {
    const habit = makeMonthly(1, "2026-01-01");
    expect(isHabitDueOnDate(habit, "2026-02-01")).toBe(true);
    expect(isHabitDueOnDate(habit, "2026-02-05")).toBe(true);
    expect(isHabitDueOnDate(habit, "2026-02-28")).toBe(true);
  });

  it("is due from createdAt in the creation month", () => {
    const habit = makeMonthly(1, "2026-01-15");
    expect(isHabitDueOnDate(habit, "2026-01-15")).toBe(true);
    expect(isHabitDueOnDate(habit, "2026-01-20")).toBe(true);
  });

  it("is not due before createdAt", () => {
    const habit = makeMonthly(1, "2026-01-15");
    expect(isHabitDueOnDate(habit, "2026-01-14")).toBe(false);
    expect(isHabitDueOnDate(habit, "2026-01-01")).toBe(false);
  });

  it("respects every-2-months cycle", () => {
    const habit = makeMonthly(2, "2026-01-01");
    expect(isHabitDueOnDate(habit, "2026-01-01")).toBe(true); // month 0
    expect(isHabitDueOnDate(habit, "2026-02-01")).toBe(false); // month 1
    expect(isHabitDueOnDate(habit, "2026-03-01")).toBe(true); // month 2
    expect(isHabitDueOnDate(habit, "2026-04-01")).toBe(false); // month 3
    expect(isHabitDueOnDate(habit, "2026-05-01")).toBe(true); // month 4
  });

  it("handles every-3-months cycle", () => {
    const habit = makeMonthly(3, "2026-03-01");
    expect(isHabitDueOnDate(habit, "2026-03-01")).toBe(true); // month 0
    expect(isHabitDueOnDate(habit, "2026-04-01")).toBe(false);
    expect(isHabitDueOnDate(habit, "2026-05-01")).toBe(false);
    expect(isHabitDueOnDate(habit, "2026-06-01")).toBe(true); // month 3
    expect(isHabitDueOnDate(habit, "2026-09-01")).toBe(true); // month 6
  });

  it("handles year boundary (every 2, created Nov)", () => {
    const habit = makeMonthly(2, "2026-11-01");
    expect(isHabitDueOnDate(habit, "2026-11-01")).toBe(true); // month 0
    expect(isHabitDueOnDate(habit, "2026-12-01")).toBe(false); // month 1
    expect(isHabitDueOnDate(habit, "2027-01-01")).toBe(true); // month 2
    expect(isHabitDueOnDate(habit, "2027-02-01")).toBe(false); // month 3
    expect(isHabitDueOnDate(habit, "2027-03-01")).toBe(true); // month 4
  });

  it("returns false for invalid months value", () => {
    expect(isHabitDueOnDate(makeMonthly(0, "2026-01-01"), "2026-02-01")).toBe(false);
    expect(isHabitDueOnDate(makeMonthly(-1, "2026-01-01"), "2026-02-01")).toBe(false);
  });

  it("Feb 1 is due in both leap and non-leap years", () => {
    const habit = makeMonthly(1, "2026-01-01");
    expect(isHabitDueOnDate(habit, "2027-02-01")).toBe(true); // non-leap
    expect(isHabitDueOnDate(habit, "2028-02-01")).toBe(true); // leap
  });

  it("completion on selectedDate itself makes it not due", () => {
    const habit = makeMonthly(1, "2026-01-01", buildHistory([["2026-02-03", { isCompleted: true }]]));
    expect(isHabitDueOnDate(habit, "2026-02-03")).toBe(false);
  });

  it("shouldShowHabitOnDate returns true for completed date even if not due", () => {
    const habit = makeMonthly(1, "2026-01-01", buildHistory([["2026-02-03", { isCompleted: true }]]));
    expect(isHabitDueOnDate(habit, "2026-02-03")).toBe(false);
    expect(shouldShowHabitOnDate(habit, "2026-02-03")).toBe(true);
  });
});

describe("isPrimaryDueDate", () => {
  it("returns true for daily habits on any date", () => {
    const habit = makeHabit({ createdAt: "2026-01-01" });
    expect(isPrimaryDueDate(habit, "2026-01-15")).toBe(true);
    expect(isPrimaryDueDate(habit, "2026-03-20")).toBe(true);
  });

  it("returns correct results for weekday habits", () => {
    const habit = makeHabit({
      repetition: { type: RepetitionType.WEEKDAYS, days: [1, 3] }, // Mon, Wed
      createdAt: "2026-01-01",
    });
    expect(isPrimaryDueDate(habit, "2026-02-16")).toBe(true); // Monday
    expect(isPrimaryDueDate(habit, "2026-02-18")).toBe(true); // Wednesday
    expect(isPrimaryDueDate(habit, "2026-02-17")).toBe(false); // Tuesday
  });

  it("returns true only on exact interval due date, not overdue days", () => {
    const habit = makeHabit({
      repetition: { type: RepetitionType.INTERVAL, days: 3 },
      createdAt: "2026-01-01",
      completionHistory: buildHistory([["2026-01-01", { isCompleted: true }]]),
    });
    expect(isPrimaryDueDate(habit, "2026-01-01")).toBe(true); // creation day
    expect(isPrimaryDueDate(habit, "2026-01-04")).toBe(true); // exact due date
    expect(isPrimaryDueDate(habit, "2026-01-05")).toBe(false); // overdue
    expect(isPrimaryDueDate(habit, "2026-01-06")).toBe(false); // overdue
  });

  it("keeps interval primary due dates on their original cadence after a miss", () => {
    const habit = makeHabit({
      repetition: { type: RepetitionType.INTERVAL, days: 3 },
      createdAt: "2026-01-01",
      completionHistory: buildHistory([["2026-01-01", { isCompleted: true }]]),
    });

    expect(isPrimaryDueDate(habit, "2026-01-04")).toBe(true);
    expect(isPrimaryDueDate(habit, "2026-01-05")).toBe(false);
    expect(isPrimaryDueDate(habit, "2026-01-07")).toBe(true);
    expect(isPrimaryDueDate(habit, "2026-01-10")).toBe(true);
  });

  it("recalculates interval primary due dates from the checked missed date", () => {
    const habit = makeHabit({
      repetition: { type: RepetitionType.INTERVAL, days: 3 },
      createdAt: "2026-01-01",
      completionHistory: buildHistory([
        ["2026-01-01", { isCompleted: true }],
        ["2026-01-05", { isCompleted: true }],
      ]),
    });

    expect(isPrimaryDueDate(habit, "2026-01-07")).toBe(false);
    expect(isPrimaryDueDate(habit, "2026-01-08")).toBe(true);
  });

  it("returns true on creation day for interval", () => {
    const habit = makeHabit({
      repetition: { type: RepetitionType.INTERVAL, days: 5 },
      createdAt: "2026-01-15",
    });
    expect(isPrimaryDueDate(habit, "2026-01-15")).toBe(true);
  });

  it("returns false before createdAt for all types", () => {
    const daily = makeHabit({ createdAt: "2026-03-01" });
    const monthly = makeHabit({
      repetition: { type: RepetitionType.MONTHLY, months: 1 },
      createdAt: "2026-03-01",
    });
    expect(isPrimaryDueDate(daily, "2026-02-28")).toBe(false);
    expect(isPrimaryDueDate(monthly, "2026-02-28")).toBe(false);
  });

  describe("monthly", () => {
    it("returns true on createdAt for creation month", () => {
      const habit = makeHabit({
        repetition: { type: RepetitionType.MONTHLY, months: 1 },
        createdAt: "2026-01-15",
      });
      expect(isPrimaryDueDate(habit, "2026-01-15")).toBe(true);
    });

    it("returns false on days after createdAt in creation month", () => {
      const habit = makeHabit({
        repetition: { type: RepetitionType.MONTHLY, months: 1 },
        createdAt: "2026-01-15",
      });
      expect(isPrimaryDueDate(habit, "2026-01-16")).toBe(false);
      expect(isPrimaryDueDate(habit, "2026-01-20")).toBe(false);
    });

    it("returns true on 1st of subsequent eligible months", () => {
      const habit = makeHabit({
        repetition: { type: RepetitionType.MONTHLY, months: 1 },
        createdAt: "2026-01-15",
      });
      expect(isPrimaryDueDate(habit, "2026-02-01")).toBe(true);
      expect(isPrimaryDueDate(habit, "2026-03-01")).toBe(true);
    });

    it("returns false on non-1st days of subsequent months", () => {
      const habit = makeHabit({
        repetition: { type: RepetitionType.MONTHLY, months: 1 },
        createdAt: "2026-01-15",
      });
      expect(isPrimaryDueDate(habit, "2026-02-02")).toBe(false);
      expect(isPrimaryDueDate(habit, "2026-02-15")).toBe(false);
    });

    it("respects non-eligible months in cycle", () => {
      const habit = makeHabit({
        repetition: { type: RepetitionType.MONTHLY, months: 2 },
        createdAt: "2026-01-01",
      });
      expect(isPrimaryDueDate(habit, "2026-01-01")).toBe(true); // month 0
      expect(isPrimaryDueDate(habit, "2026-02-01")).toBe(false); // month 1
      expect(isPrimaryDueDate(habit, "2026-03-01")).toBe(true); // month 2
    });

    it("returns false for invalid months value", () => {
      const habit = makeHabit({
        repetition: { type: RepetitionType.MONTHLY, months: 0 },
        createdAt: "2026-01-01",
      });
      expect(isPrimaryDueDate(habit, "2026-02-01")).toBe(false);
    });

    it("created on 1st: createdAt IS the primary due date", () => {
      const habit = makeHabit({
        repetition: { type: RepetitionType.MONTHLY, months: 1 },
        createdAt: "2026-01-01",
      });
      expect(isPrimaryDueDate(habit, "2026-01-01")).toBe(true);
      expect(isPrimaryDueDate(habit, "2026-01-02")).toBe(false);
    });
  });
});
