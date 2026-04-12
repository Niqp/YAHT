import React from "react";
import { render, screen } from "@testing-library/react-native";

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
    },
  }),
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
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
});
