import React from "react";
import { act, render } from "@testing-library/react-native";

let focusEffectCallback: (() => void) | undefined;

const mockSetSelectedDate = jest.fn();

const mockState = {
    _hasHydrated: true,
    selectedDate: "2026-02-20",
    setSelectedDate: mockSetSelectedDate,
};

jest.mock("@/store/habitStore", () => {
  const useHabitStore = Object.assign(
    (selector: (state: typeof mockState) => unknown) => selector(mockState),
    { getState: () => mockState }
  );

  return { useHabitStore };
});

jest.mock("@/components/dateSlider/DateSlider", () => () => null);
jest.mock("@/components/HabitList/HabitList", () => () => null);
jest.mock("@/components/buttons/FloatingButton", () => ({
    FloatingButton: () => null,
}));
jest.mock("@/components/habit/HabitBottomSheet/HabitBottomSheet", () => () => null);

jest.mock("@/hooks/useTheme", () => ({
    useTheme: () => ({
        colors: {
            background: "#000",
            primary: "#fff",
        },
    }),
}));

jest.mock("expo-router", () => ({
    router: { push: jest.fn() },
    useFocusEffect: (cb: () => void) => {
        focusEffectCallback = cb;
    },
}));

jest.mock("@/utils/date", () => {
    const actual = jest.requireActual("@/utils/date");
    return {
        ...actual,
        getCurrentDateStamp: () => "2026-02-21",
    };
});

import TodayScreen from "@/app/(tabs)/today";

describe("TodayScreen focus reset behavior", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        focusEffectCallback = undefined;
        mockState._hasHydrated = true;
        mockState.selectedDate = "2026-02-20";
    });

    it("resets selected date to today on first focus", () => {
        render(<TodayScreen />);

        act(() => {
            focusEffectCallback?.();
        });

        expect(mockSetSelectedDate).toHaveBeenCalledWith("2026-02-21");
    });

    it("does not reset again after selectedDate becomes today while still focused", () => {
        render(<TodayScreen />);

        act(() => {
            focusEffectCallback?.();
        });

        expect(mockSetSelectedDate).toHaveBeenCalledTimes(1);

        mockState.selectedDate = "2026-02-21";

        act(() => {
            focusEffectCallback?.();
        });

        expect(mockSetSelectedDate).toHaveBeenCalledTimes(1);
    });
});
