import React from "react";
import { render, screen } from "@testing-library/react-native";
import dayjs from "dayjs";
import PerformanceLineChart from "@/components/stats/charts/PerformanceLineChart";
import { CompletionType, type ChartDay } from "@/types/habit";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: jest.requireActual("@/constants/Colors").Colors.sepia.light,
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "stats.goalMet": "Goal met",
        "common.completed": "Completed",
        "stats.goal": "Goal",
        "stats.off": "Off",
      };

      return labels[key] ?? key;
    },
  }),
}));

const makeDay = (overrides: Partial<ChartDay>): ChartDay => ({
  date: dayjs().format("YYYY-MM-DD"),
  label: "Mon",
  isDue: true,
  isCompleted: false,
  value: 0,
  goal: 10,
  ...overrides,
});

describe("PerformanceLineChart", () => {
  it("renders a future scheduled day as off instead of a zero-value due day", () => {
    const futureDate = dayjs().add(1, "day").format("YYYY-MM-DD");

    render(
      <PerformanceLineChart
        days={[makeDay({ date: futureDate, label: "Tue" })]}
        completionType={CompletionType.REPETITIONS}
      />
    );

    expect(screen.getAllByText("Off")).toHaveLength(2);
    expect(screen.queryByText("0")).toBeNull();
  });
});
