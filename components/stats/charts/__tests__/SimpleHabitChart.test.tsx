import React from "react";
import { render, screen } from "@testing-library/react-native";
import dayjs from "dayjs";
import SimpleHabitChart from "@/components/stats/charts/SimpleHabitChart";
import { Colors } from "@/constants/Colors";
import type { ChartDay } from "@/types/habit";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: jest.requireActual("@/constants/Colors").Colors.sepia.light,
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "common.done": "Done",
        "stats.missed": "Missed",
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
  goal: null,
  ...overrides,
});

describe("SimpleHabitChart", () => {
  it("does not render a future scheduled day as missed", () => {
    const futureDate = dayjs().add(1, "day").format("YYYY-MM-DD");

    render(<SimpleHabitChart days={[makeDay({ date: futureDate, label: "Tue" })]} />);

    expect(screen.getByTestId(`simple-habit-chart-day-${futureDate}`)).toHaveStyle({
      borderColor: Colors.sepia.light.inputBorder,
    });
  });
});
