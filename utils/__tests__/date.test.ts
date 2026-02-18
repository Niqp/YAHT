/**
 * Tests for utility functions in utils/date.ts.
 *
 * Covers: formatTime, getOrderedWeekDays, addDays, formatDate,
 * getMonthName, getShortDayName, getDay, getYear, getEpochMilliseconds.
 *
 * Note: shouldShowHabitOnDate is covered in completionHistory.test.ts.
 */

import {
  formatTime,
  getOrderedWeekDays,
  addDays,
  formatDate,
  getMonthName,
  getShortDayName,
  getDay,
  getYear,
  getEpochMilliseconds,
} from "@/utils/date";

// ─── formatTime ───────────────────────────────────────────────────────────────

describe("formatTime", () => {
  it("formats zero milliseconds as 00:00:00", () => {
    expect(formatTime(0)).toBe("00:00:00");
  });

  it("formats 1 second (1000ms) correctly", () => {
    expect(formatTime(1000)).toBe("00:00:01");
  });

  it("formats 1 minute (60000ms) correctly", () => {
    expect(formatTime(60_000)).toBe("00:01:00");
  });

  it("formats 1 hour (3600000ms) correctly", () => {
    expect(formatTime(3_600_000)).toBe("01:00:00");
  });

  it("formats a mixed duration correctly", () => {
    // 1h 23m 45s = 5025000ms
    const ms = (1 * 3600 + 23 * 60 + 45) * 1000;
    expect(formatTime(ms)).toBe("01:23:45");
  });

  it("formats 90 seconds as 00:01:30", () => {
    expect(formatTime(90_000)).toBe("00:01:30");
  });
});

// ─── getOrderedWeekDays ───────────────────────────────────────────────────────

describe("getOrderedWeekDays", () => {
  it("starts with Sunday when startDay is 0", () => {
    const days = getOrderedWeekDays(0);
    expect(days[0]).toEqual({ dayIndex: 0, name: "Sunday" });
    expect(days[6]).toEqual({ dayIndex: 6, name: "Saturday" });
  });

  it("starts with Monday when startDay is 1", () => {
    const days = getOrderedWeekDays(1);
    expect(days[0]).toEqual({ dayIndex: 1, name: "Monday" });
    expect(days[6]).toEqual({ dayIndex: 0, name: "Sunday" });
  });

  it("starts with Saturday when startDay is 6", () => {
    const days = getOrderedWeekDays(6);
    expect(days[0]).toEqual({ dayIndex: 6, name: "Saturday" });
    expect(days[1]).toEqual({ dayIndex: 0, name: "Sunday" });
  });

  it("always returns exactly 7 days", () => {
    for (let i = 0; i < 7; i++) {
      expect(getOrderedWeekDays(i)).toHaveLength(7);
    }
  });

  it("contains all 7 unique day indices regardless of start", () => {
    const days = getOrderedWeekDays(3); // Wednesday start
    const indices = days.map((d) => d.dayIndex).sort();
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

// ─── addDays ─────────────────────────────────────────────────────────────────

describe("addDays", () => {
  it("adds positive days to a date string", () => {
    const result = addDays("2026-01-01", 5);
    expect(result.format("YYYY-MM-DD")).toBe("2026-01-06");
  });

  it("subtracts days when given a negative number", () => {
    const result = addDays("2026-01-10", -3);
    expect(result.format("YYYY-MM-DD")).toBe("2026-01-07");
  });

  it("handles month boundaries correctly", () => {
    const result = addDays("2026-01-30", 3);
    expect(result.format("YYYY-MM-DD")).toBe("2026-02-02");
  });

  it("handles year boundaries correctly", () => {
    const result = addDays("2025-12-31", 1);
    expect(result.format("YYYY-MM-DD")).toBe("2026-01-01");
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("returns a YYYY-MM-DD string from a date string", () => {
    expect(formatDate("2026-06-15")).toBe("2026-06-15");
  });

  it("returns a YYYY-MM-DD string from a Date object", () => {
    expect(formatDate(new Date("2026-03-01"))).toBe("2026-03-01");
  });
});

// ─── getMonthName ─────────────────────────────────────────────────────────────

describe("getMonthName", () => {
  it("returns Jan for January", () => {
    expect(getMonthName("2026-01-15")).toBe("Jan");
  });

  it("returns Dec for December", () => {
    expect(getMonthName("2026-12-01")).toBe("Dec");
  });

  it("returns Jun for June", () => {
    expect(getMonthName("2026-06-20")).toBe("Jun");
  });
});

// ─── getShortDayName ──────────────────────────────────────────────────────────

describe("getShortDayName", () => {
  it("returns Mon for a Monday", () => {
    // 2026-02-16 is a Monday
    expect(getShortDayName("2026-02-16")).toBe("Mon");
  });

  it("returns Sun for a Sunday", () => {
    // 2026-02-15 is a Sunday
    expect(getShortDayName("2026-02-15")).toBe("Sun");
  });

  it("returns Sat for a Saturday", () => {
    // 2026-02-14 is a Saturday
    expect(getShortDayName("2026-02-14")).toBe("Sat");
  });
});

// ─── getDay ───────────────────────────────────────────────────────────────────

describe("getDay", () => {
  it("returns the day of the month", () => {
    expect(getDay("2026-01-01")).toBe(1);
    expect(getDay("2026-03-31")).toBe(31);
    expect(getDay("2026-06-15")).toBe(15);
  });
});

// ─── getYear ──────────────────────────────────────────────────────────────────

describe("getYear", () => {
  it("returns the year from a date string", () => {
    expect(getYear("2026-01-01")).toBe(2026);
    expect(getYear("2025-12-31")).toBe(2025);
  });
});

// ─── getEpochMilliseconds ─────────────────────────────────────────────────────

describe("getEpochMilliseconds", () => {
  it("returns a positive number for any valid date", () => {
    expect(getEpochMilliseconds("2026-01-01")).toBeGreaterThan(0);
  });

  it("returns a larger value for a later date", () => {
    const earlier = getEpochMilliseconds("2026-01-01");
    const later = getEpochMilliseconds("2026-12-31");
    expect(later).toBeGreaterThan(earlier);
  });

  it("returns the same value for the same date", () => {
    expect(getEpochMilliseconds("2026-06-15")).toBe(getEpochMilliseconds("2026-06-15"));
  });
});
