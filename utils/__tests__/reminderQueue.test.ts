import dayjs from "dayjs";

import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import { buildReminderQueue, NORMAL_REMINDER_NOTIFICATION_LIMIT } from "@/utils/reminderQueue";

jest.mock("@/utils/notifications", () => ({
  MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE: 3,
  getReminderNotificationIdentifier: (seriesId: string, timestamp: number) => `reminder-${seriesId}-${timestamp}`,
  getReminderNotificationSeriesId: (habitId: string, reminderDate: string) => `series-${habitId}-${reminderDate}`,
}));

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: "h1",
  title: "Stretch",
  icon: "*",
  repetition: { type: RepetitionType.DAILY },
  completion: { type: CompletionType.SIMPLE },
  completionHistory: {},
  createdAt: "2026-03-19",
  reminder: {
    enabled: true,
    hour: 9,
    minute: 0,
    repeatIfNotCompleted: false,
  },
  ...overrides,
});

describe("buildReminderQueue", () => {
  it("expands daily reminders with one primary and up to three nags per occurrence", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit({
          reminder: {
            enabled: true,
            hour: 9,
            minute: 0,
            repeatIfNotCompleted: true,
            repeatIntervalMs: 5 * 60 * 1000,
          },
        }),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    const firstOccurrenceJobs = queue.normalJobs.filter((job) => job.reminderDate === "2026-03-21");

    expect(firstOccurrenceJobs).toHaveLength(4);
    expect(firstOccurrenceJobs.map((job) => job.attemptNumber)).toEqual([0, 1, 2, 3]);
    expect(firstOccurrenceJobs.at(-1)).toEqual(
      expect.objectContaining({
        timestamp: dayjs("2026-03-21T09:15:00").valueOf(),
        maxAttempts: 4,
      })
    );
  });

  it("skips completed occurrences", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit({
          completionHistory: {
            "2026-03-21": { isCompleted: true },
          },
        }),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-03-22",
        timestamp: dayjs("2026-03-22T09:00:00").valueOf(),
      })
    );
  });

  it("builds reminder timestamps in the provided timezone", () => {
    const queueOptions = {
      habits: {
        h1: makeHabit(),
      },
      nowMs: Date.UTC(2026, 3, 23, 22, 30),
      timeZone: "Europe/London",
    };

    const queue = buildReminderQueue(queueOptions);

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-04-24",
        timestamp: Date.UTC(2026, 3, 24, 8, 0),
      })
    );
  });

  it("builds reminder timestamps with a native utc offset when provided", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit(),
      },
      nowMs: Date.UTC(2026, 3, 23, 22, 30),
      timeZone: "Europe/Paris",
      utcOffsetMinutes: 120,
    });

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-04-24",
        timestamp: Date.UTC(2026, 3, 24, 7, 0),
      })
    );
  });

  it("uses the native utc offset ahead of the timezone name", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit(),
      },
      nowMs: Date.UTC(2026, 3, 23, 22, 30),
      timeZone: "Europe/Paris",
      utcOffsetMinutes: 60,
    });

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-04-24",
        timestamp: Date.UTC(2026, 3, 24, 8, 0),
      })
    );
  });

  it("expands weekday reminders only on configured weekdays", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit({
          repetition: { type: RepetitionType.WEEKDAYS, days: [1] },
        }),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-03-23",
      })
    );
    expect(queue.hasOverflow).toBe(false);
  });

  it("uses interval habit due dates anchored to the last completion", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit({
          repetition: { type: RepetitionType.INTERVAL, days: 3 },
          completionHistory: {
            "2026-03-20": { isCompleted: true },
          },
        }),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-03-23",
        timestamp: dayjs("2026-03-23T09:00:00").valueOf(),
      })
    );
  });

  it("does not create nags for invalid repeat intervals", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit({
          reminder: {
            enabled: true,
            hour: 9,
            minute: 0,
            repeatIfNotCompleted: true,
            repeatIntervalMs: 0,
          },
        }),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(queue.normalJobs.filter((job) => job.reminderDate === "2026-03-21")).toHaveLength(1);
    expect(queue.normalJobs[0]).toEqual(expect.objectContaining({ attemptNumber: 0, maxAttempts: 1 }));
  });

  it("shifts only the matching occurrence when snoozed", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit({
          reminder: {
            enabled: true,
            hour: 9,
            minute: 0,
            repeatIfNotCompleted: false,
            snoozedDate: "2026-03-21",
            snoozedUntilMs: dayjs("2026-03-21T10:00:00").valueOf(),
          },
        }),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-03-21",
        timestamp: dayjs("2026-03-21T10:00:00").valueOf(),
      })
    );
    expect(queue.normalJobs[1]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-03-22",
        timestamp: dayjs("2026-03-22T09:00:00").valueOf(),
      })
    );
  });

  it("skips past primaries while keeping eligible future nags", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit({
          reminder: {
            enabled: true,
            hour: 9,
            minute: 0,
            repeatIfNotCompleted: true,
            repeatIntervalMs: 5 * 60 * 1000,
          },
        }),
      },
      nowMs: dayjs("2026-03-21T09:07:00").valueOf(),
    });

    expect(queue.normalJobs[0]).toEqual(
      expect.objectContaining({
        reminderDate: "2026-03-21",
        attemptNumber: 2,
        timestamp: dayjs("2026-03-21T09:10:00").valueOf(),
      })
    );
  });

  it("caps normal jobs at 63 and emits a stop notification when overflow exists", () => {
    const queue = buildReminderQueue({
      habits: {
        h1: makeHabit(),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(queue.normalJobs).toHaveLength(NORMAL_REMINDER_NOTIFICATION_LIMIT);
    expect(queue.hasOverflow).toBe(true);
    expect(queue.stopJob).toEqual(
      expect.objectContaining({
        notificationId: "reminder-stop",
        overflowTimestamp: dayjs("2026-05-23T09:00:00").valueOf(),
      })
    );
    expect(queue.scannedDays).toBeLessThan(366);
  });

  it("sorts deterministic ties by habit id", () => {
    const queue = buildReminderQueue({
      habits: {
        b: makeHabit({ id: "b", title: "Breathe" }),
        a: makeHabit({ id: "a", title: "Stretch" }),
      },
      nowMs: dayjs("2026-03-21T08:00:00").valueOf(),
    });

    expect(queue.normalJobs.slice(0, 2).map((job) => job.habitId)).toEqual(["a", "b"]);
  });
});
