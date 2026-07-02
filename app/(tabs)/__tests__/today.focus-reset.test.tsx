import React from "react";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

const mockSetSelectedDate = jest.fn();

const mockState = {
  _hasHydrated: true,
  selectedDate: "2026-02-20",
  setSelectedDate: mockSetSelectedDate,
};

jest.mock("@/store/habitStore", () => {
  const useHabitStore = Object.assign((selector: (state: typeof mockState) => unknown) => selector(mockState), {
    getState: () => mockState,
  });

  return { useHabitStore };
});

jest.mock("@/components/dateSlider/DateSlider", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const mockReactNative = jest.requireActual<typeof import("react-native")>("react-native");

  return () => mockReact.createElement(mockReactNative.View, { testID: "date-slider" });
});
jest.mock("@/components/HabitList/HabitList", () => () => null);
jest.mock("@/components/buttons/FloatingButton", () => ({
  FloatingButton: () => null,
}));
jest.mock("@/components/habit/HabitBottomSheet/HabitBottomSheet", () => () => null);

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      bgApp: "#000",
      accent: "#fff",
      gradientHeaderStart: "#21160d",
    },
  }),
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("@/utils/date", () => {
  const actual = jest.requireActual("@/utils/date");
  return {
    ...actual,
    getCurrentDateStamp: () => "2026-02-21",
  };
});

import TodayScreen from "@/app/(tabs)/today";

describe("TodayScreen date header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState._hasHydrated = true;
    mockState.selectedDate = "2026-02-20";
  });

  it("renders the date slider that owns focus-based date reset", () => {
    render(<TodayScreen />);

    expect(screen.getByTestId("date-slider")).toBeTruthy();
    expect(mockSetSelectedDate).not.toHaveBeenCalled();
  });

  it("uses the Today header color behind the top safe area", () => {
    const { toJSON } = render(<TodayScreen />);
    const root = toJSON();
    const rootStyle = StyleSheet.flatten(root?.props.style) as { backgroundColor?: string };

    expect(rootStyle.backgroundColor).toBe("#21160d");
  });

  it("keeps the content area on the app background below the date header", () => {
    const { toJSON } = render(<TodayScreen />);
    const root = toJSON();
    const safeAreaContent = root?.children?.[0];
    const body = safeAreaContent?.children?.[1];
    const bodyStyle = StyleSheet.flatten(body?.props.style) as { backgroundColor?: string };

    expect(bodyStyle.backgroundColor).toBe("#000");
  });
});
