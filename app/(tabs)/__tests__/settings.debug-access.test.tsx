import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

const mockResetStore = jest.fn();

const themeState = {
  colorTheme: "sepia",
  isDarkMode: false,
  mode: "system",
  timedHabitGoalBehavior: "continue",
  weekStartDay: 1,
};

jest.mock("expo-constants", () => ({
  expoConfig: { version: "1.0.0" },
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("lucide-react-native", () => ({
  Bug: () => null,
  ChevronRight: () => null,
  Code2: () => null,
  Download: () => null,
  Trash2: () => null,
  Upload: () => null,
}));

jest.mock("@/components/ui", () => ({
  AppSegmentedControl: ({ values }: { values: string[] }) => {
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return <View testID={`segmented-${values.join("-")}`} />;
  },
  AppText: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return <Text style={style}>{children}</Text>;
  },
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    ...themeState,
    colors: {
      bgApp: "#fff",
      bgSurface: "#fff",
      borderDefault: "#ddd",
      borderSubtle: "#eee",
      danger: "#c00",
      iconPrimary: "#111",
      ripple: "#eee",
      textPrimary: "#111",
      textSecondary: "#666",
    },
    setColorTheme: jest.fn(),
    setMode: jest.fn(),
    setTimedHabitGoalBehavior: jest.fn(),
    setWeekStartDay: jest.fn(),
  }),
}));

jest.mock("@/store/habitStore", () => {
  const useHabitStore = Object.assign(
    (selector: (state: { resetStore: typeof mockResetStore }) => unknown) => {
      return selector({ resetStore: mockResetStore });
    },
    {
      persist: { clearStorage: jest.fn() },
    }
  );

  return { useHabitStore };
});

jest.mock("@/utils/fileOperations", () => ({
  exportData: jest.fn(),
  importData: jest.fn(),
}));

import SettingsScreen from "@/app/(tabs)/settings";
import { router } from "expo-router";

describe("SettingsScreen debug access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reveals reminder debug logs only after pressing the version card seven times", () => {
    render(<SettingsScreen />);

    expect(screen.queryByText("Reminder debug logs")).toBeNull();

    for (let count = 0; count < 6; count += 1) {
      fireEvent.press(screen.getByText("Version"));
      expect(screen.queryByText("Reminder debug logs")).toBeNull();
    }

    fireEvent.press(screen.getByText("Version"));

    expect(screen.getByText("Reminder debug logs")).toBeOnTheScreen();
  });

  it("opens the debug route after the hidden row is revealed", () => {
    render(<SettingsScreen />);

    for (let count = 0; count < 7; count += 1) {
      fireEvent.press(screen.getByText("Version"));
    }

    fireEvent.press(screen.getByText("Reminder debug logs"));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/debug-reminder", params: { inspect: "1" } });
  });
});
