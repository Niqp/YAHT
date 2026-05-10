import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";
import HabitList from "../HabitList";

const mockHandleHabitAction = jest.fn();

let mockCurrentDate = "2026-02-20";
const mockState: {
  habits: HabitMap;
  selectedDate: string;
} = {
  habits: {},
  selectedDate: "2026-02-20",
};

jest.mock("@/store/habitStore", () => ({
  useHabitStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: jest.requireActual("@/constants/Colors").Colors.sepia.light,
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string, values?: { title?: string; count?: number }) => {
      const labels: Record<string, string> = {
        "habits.toDo": "To Do",
        "habits.scheduled": "Scheduled",
        "habits.missed": "Missed",
        "common.completed": "Completed",
        "habits.emptyDay": "No habits for this day",
        "habits.emptyHint": "Tap the + button to add your first habit",
      };

      if (key === "habits.groupAccessibility") {
        return `${values?.title}, ${values?.count} habits`;
      }

      return labels[key] ?? key;
    },
  }),
}));

jest.mock("@/utils/date", () => {
  const actual = jest.requireActual("@/utils/date");
  return {
    ...actual,
    getCurrentDateStamp: () => mockCurrentDate,
  };
});

jest.mock("@/components/habit/HabitItem", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");

  return function MockHabitItem({ habitId, presentationStatus }: { habitId: string; presentationStatus?: string }) {
    return React.createElement(Text, null, `${presentationStatus ?? "none"}:${habitId}`);
  };
});

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    title: "Read",
    icon: "book",
    repetition: { type: RepetitionType.DAILY },
    completion: { type: CompletionType.SIMPLE },
    completionHistory: {},
    createdAt: "2026-01-01",
    ...overrides,
  };
}

describe("HabitList presentation states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentDate = "2026-02-20";
    mockState.selectedDate = "2026-02-20";
    mockState.habits = {};
  });

  it("groups future habits under Scheduled and passes the scheduled presentation state", () => {
    mockCurrentDate = "2026-02-20";
    mockState.selectedDate = "2026-02-21";
    mockState.habits = {
      future: makeHabit({ id: "future", title: "Future daily" }),
    };

    render(<HabitList handleHabitAction={mockHandleHabitAction} />);

    expect(screen.getByText("Scheduled • 1")).toBeTruthy();
    expect(screen.getByText("scheduled:future")).toBeTruthy();
    expect(screen.queryByText("To Do • 1")).toBeNull();
  });

  it("groups carried monthly misses under Missed but returns to To Do on the next scheduled date", () => {
    mockCurrentDate = "2026-03-10";
    mockState.selectedDate = "2026-02-02";
    mockState.habits = {
      monthly: makeHabit({
        id: "monthly",
        title: "Monthly review",
        repetition: { type: RepetitionType.MONTHLY, months: 1 },
        createdAt: "2026-01-15",
      }),
    };

    const { rerender } = render(<HabitList handleHabitAction={mockHandleHabitAction} />);

    expect(screen.getByText("Missed • 1")).toBeTruthy();
    expect(screen.getByText("missed:monthly")).toBeTruthy();

    mockState.selectedDate = "2026-03-01";
    rerender(<HabitList handleHabitAction={mockHandleHabitAction} />);

    expect(screen.getByText("To Do • 1")).toBeTruthy();
    expect(screen.getByText("normal:monthly")).toBeTruthy();
    expect(screen.queryByText("Missed • 1")).toBeNull();
  });
});
