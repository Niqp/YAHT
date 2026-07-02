import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

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

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
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

jest.mock("@/utils/diagnostics/diagnosticExport", () => ({
  exportDiagnosticReport: jest.fn(async () => ({ fileName: "yaht-diagnostics.json", uri: "file:///picked/log.json" })),
}));

import SettingsScreen from "@/app/(tabs)/settings";
import { exportDiagnosticReport } from "@/utils/diagnostics/diagnosticExport";

describe("SettingsScreen debug access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reveals diagnostic export only after pressing the version card seven times", () => {
    render(<SettingsScreen />);

    expect(screen.queryByText("Export diagnostic logs")).toBeNull();

    for (let count = 0; count < 6; count += 1) {
      fireEvent.press(screen.getByText("Version"));
      expect(screen.queryByText("Export diagnostic logs")).toBeNull();
    }

    fireEvent.press(screen.getByText("Version"));

    expect(screen.getByText("Export diagnostic logs")).toBeOnTheScreen();
  });

  it("exports diagnostic logs after the hidden row is revealed", () => {
    render(<SettingsScreen />);

    for (let count = 0; count < 7; count += 1) {
      fireEvent.press(screen.getByText("Version"));
    }

    fireEvent.press(screen.getByText("Export diagnostic logs"));

    expect(exportDiagnosticReport).toHaveBeenCalledTimes(1);
  });

  it("shows the diagnostic export failure message", async () => {
    jest.mocked(exportDiagnosticReport).mockRejectedValueOnce(new Error("Directory unavailable"));
    const alertSpy = jest.spyOn(Alert, "alert");

    render(<SettingsScreen />);

    for (let count = 0; count < 7; count += 1) {
      fireEvent.press(screen.getByText("Version"));
    }

    fireEvent.press(screen.getByText("Export diagnostic logs"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Export Failed", "Failed to save diagnostic logs: Directory unavailable");
    });
  });
});
