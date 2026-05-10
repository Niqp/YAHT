import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Colors } from "@/constants/Colors";
import { CompletionType, RepetitionType, type Habit, type HabitMap } from "@/types/habit";
import HabitItem from "../HabitItem";

const mockOnLongPress = jest.fn();

const mockState: {
  habits: HabitMap;
  selectedDate: string;
  updateCompletion: jest.Mock;
  activateTimer: jest.Mock;
  removeTimer: jest.Mock;
  activeTimers: Record<string, Record<string, unknown>>;
  timerRenderTickMs: number;
} = {
  habits: {},
  selectedDate: "2026-02-20",
  updateCompletion: jest.fn(),
  activateTimer: jest.fn(),
  removeTimer: jest.fn(),
  activeTimers: {},
  timerRenderTickMs: 0,
};

jest.mock("@/store/habitStore", () => ({
  useHabitStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: jest.requireActual("@/constants/Colors").Colors.sepia.light,
    timedHabitGoalBehavior: "allow",
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/utils/haptics", () => ({
  haptic: {
    complete: jest.fn(),
  },
}));

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

describe("HabitItem presentation states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.selectedDate = "2026-02-20";
    mockState.habits = {
      "habit-1": makeHabit(),
    };
    mockState.activeTimers = {};
    mockState.timerRenderTickMs = 0;
  });

  it("dims scheduled future habits", () => {
    render(<HabitItem habitId="habit-1" onLongPress={mockOnLongPress} presentationStatus="scheduled" />);

    expect(screen.getByTestId("habit-item-habit-1")).toHaveStyle({ opacity: 0.55 });
  });

  it("uses calm danger styling for missed carry-over habits", () => {
    render(<HabitItem habitId="habit-1" onLongPress={mockOnLongPress} presentationStatus="missed" />);

    expect(screen.getByTestId("habit-item-habit-1")).toHaveStyle({
      borderColor: Colors.sepia.light.dangerSoftBorder,
      backgroundColor: Colors.sepia.light.bgSurface,
    });
    expect(screen.getByTestId("habit-item-content-habit-1")).toHaveStyle({
      backgroundColor: Colors.sepia.light.bgSurface,
    });
  });

  it("uses one full-width calm danger fill for missed carry-over habits", () => {
    render(<HabitItem habitId="habit-1" onLongPress={mockOnLongPress} presentationStatus="missed" />);

    expect(screen.getByTestId("habit-item-progress-habit-1")).toHaveStyle({
      width: "100%",
      backgroundColor: Colors.sepia.light.dangerSoftBg,
      opacity: 1,
    });
  });
});
