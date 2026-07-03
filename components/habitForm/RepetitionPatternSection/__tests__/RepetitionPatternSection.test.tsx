import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import RepetitionPatternSection from "../RepetitionPatternSection";
import { Spacing } from "@/constants/Spacing";
import { RepetitionType } from "@/types/habit";

jest.mock("@/components/ui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  return {
    AppSegmentedControl: ({ values }: { values: string[] }) => (
      <View>
        {values.map((value) => (
          <Text key={value}>{value}</Text>
        ))}
      </View>
    ),
    AppText: ({ children, style }: { children: React.ReactNode; style?: unknown }) => (
      <Text style={style}>{children}</Text>
    ),
  };
});

jest.mock("@/components/ui/form", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    FormSection: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    PresetPills: () => <View />,
    WheelPicker: () => <View />,
  };
});

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      accent: "#d0ad73",
      accentSoftBg: "#453728",
      bgInset: "#3a2e22",
      borderSubtle: "#3b3026",
      chipBg: "#453728",
      chipBorder: "#5a4a39",
      chipText: "#d1c0a9",
      chipSelectedBg: "#bc925a",
      chipSelectedBorder: "#bc925a",
      chipSelectedText: "#22170c",
      danger: "#ff6b6b",
      textPrimary: "#f5e8d6",
      textSecondary: "#d1c0a9",
      textTertiary: "#a9947b",
      ripple: "#ffffff22",
    },
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, params?: { count?: number }) => {
      const messages: Record<string, string> = {
        "form.daily": "Daily",
        "form.weekly": "Weekly",
        "form.interval": "Interval",
        "form.monthly": "Monthly",
        "form.pickWeekdays": "Pick the weekdays when this habit should appear.",
        "form.selectedDays": `${params?.count ?? 0} days selected`,
        "form.pickAtLeastOneDay": "Pick at least one day",
        "form.quickWeekdays": "Weekdays",
        "form.quickWeekend": "Weekend",
        "form.quickEveryDay": "Every day",
      };

      return messages[key] ?? key;
    },
  }),
}));

jest.mock("@/utils/haptics", () => ({
  haptic: {
    medium: jest.fn(),
  },
}));

const findPressableAncestor = (node: ReturnType<typeof screen.getByText>) => {
  let current = node.parent;

  while (current && typeof current.props.style !== "function") {
    current = current.parent;
  }

  if (!current) {
    throw new Error("Expected label to be inside a pressable control");
  }

  return current;
};

const flattenPressableStyle = (node: ReturnType<typeof findPressableAncestor>) => {
  return typeof node.props.style === "function"
    ? StyleSheet.flatten(node.props.style({ pressed: false }))
    : StyleSheet.flatten(node.props.style);
};

const findAncestorStyle = (
  node: ReturnType<typeof findPressableAncestor>,
  predicate: (style: Record<string, unknown>) => boolean
) => {
  let current = node.parent;

  while (current) {
    const style = StyleSheet.flatten(current.props.style) as Record<string, unknown>;

    if (style && predicate(style)) {
      return style;
    }

    current = current.parent;
  }

  throw new Error("Expected matching styled ancestor");
};

describe("RepetitionPatternSection weekly selector", () => {
  it("renders a single full-width week rail with summary and quick presets", () => {
    const setSelectedDays = jest.fn();
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    render(
      <RepetitionPatternSection
        repetitionType={RepetitionType.WEEKDAYS}
        setRepetitionType={jest.fn()}
        selectedDays={[1, 3, 5]}
        setSelectedDays={setSelectedDays}
        customDays={1}
        setCustomDays={jest.fn()}
        customMonths={1}
        setCustomMonths={jest.fn()}
        weekStartDay={1}
        presentation="sheet"
        showHeading={false}
      />
    );

    const dayButtons = labels.map((label) => findPressableAncestor(screen.getByText(label)));
    const weekRail = dayButtons[0].parent;
    const weekRailStyle = StyleSheet.flatten(weekRail?.props.style);
    const weekdaySelectorStyle = findAncestorStyle(
      dayButtons[0],
      (style) => style.width === "100%" && "gap" in style && style.flexDirection !== "row"
    );

    expect(dayButtons.every((button) => button.parent === weekRail)).toBe(true);
    expect(weekdaySelectorStyle).toMatchObject({
      gap: Spacing.md,
      marginTop: Spacing.xs,
    });
    expect(weekRailStyle).toMatchObject({
      width: "100%",
      flexDirection: "row",
    });
    expect(flattenPressableStyle(findPressableAncestor(screen.getByText("Sat")))).toMatchObject({
      opacity: 0.48,
    });
    expect(screen.getByText("3 days selected")).toBeOnTheScreen();
    expect(screen.getByText("Weekdays")).toBeOnTheScreen();
    expect(screen.getByText("Weekend")).toBeOnTheScreen();
    expect(screen.getByText("Every day")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Weekend"));

    expect(setSelectedDays).toHaveBeenCalledWith(expect.arrayContaining([0, 6]));
    expect(setSelectedDays.mock.calls[0][0]).toHaveLength(2);
  });
});
