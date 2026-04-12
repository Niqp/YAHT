import React, { type ReactNode } from "react";
import { AppState, StyleSheet } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import DateSlider from "@/components/dateSlider/DateSlider";

const TODAY = "2026-02-21";
const PREVIOUS_DAY = "2026-02-20";
const NEXT_DAY = "2026-02-22";
const ACCENT_SOFT_BG_COLOR = "#e0e7ff";
const BUTTON_PRIMARY_BG_COLOR = "#4a67ff";

type MockHabitStoreState = {
  selectedDate: string;
  habits: Record<string, never>;
  setSelectedDate: (date: string) => void;
};

type MockDateRow = {
  date: string;
};

type MockDataProviderShape = {
  _rows?: MockDateRow[];
};

type MockRecyclerListViewRef = {
  scrollToIndex: (index: number, animate?: boolean) => void;
};

type MockRecyclerListViewProps = {
  dataProvider?: MockDataProviderShape;
  rowRenderer: (type: string | number, item: MockDateRow, index: number) => ReactNode;
};

let mockStore: UseBoundStore<StoreApi<MockHabitStoreState>>;
let mockCurrentDate = TODAY;
let appStateChangeListener: ((state: string) => void) | null = null;

const createMockStore = () =>
  create<MockHabitStoreState>((set) => ({
    selectedDate: TODAY,
    habits: {},
    setSelectedDate: jest.fn((date: string) => {
      set({ selectedDate: date });
    }),
  }));

jest.mock("@/store/habitStore", () => {
  const useHabitStore = Object.assign(
    (mockSelector: (state: MockHabitStoreState) => unknown) => mockStore(mockSelector),
    { getState: () => mockStore.getState() }
  );

  return { useHabitStore };
});

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      inputBg: "#1b1b1b",
      buttonPrimaryBg: BUTTON_PRIMARY_BG_COLOR,
      buttonPrimaryText: "#ffffff",
      accentSoftBg: ACCENT_SOFT_BG_COLOR,
      accentSoftBorder: "#a5b4fc",
      accent: "#ff8a00",
      borderDefault: "#2b2b2b",
      textSecondary: "#6f6f6f",
      textOnStrong: "#ffffff",
      textPrimary: "#0f0f0f",
      bgChrome: "#101010",
      bgSurfaceElevated: "#181818",
      gradientHeaderStart: "#101010",
      gradientHeaderMid: "#181818",
      gradientHeaderEnd: "#050505",
    },
  }),
}));

jest.mock("@/hooks/useAllHabitsStreak", () => ({
  useAllHabitsStreak: () => 0,
}));

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
}));

jest.mock("@/utils/date", () => {
  const actual = jest.requireActual<typeof import("@/utils/date")>("@/utils/date");
  const mockDayjs = jest.requireActual("dayjs") as typeof import("dayjs");

  return {
    ...actual,
    getCurrentDateDayjs: () => mockDayjs(mockCurrentDate),
  };
});

jest.mock("lucide-react-native", () => ({
  ChevronLeft: () => null,
}));

jest.mock("react-native-reanimated", () => {
  const reanimatedMock = jest.requireActual("react-native-reanimated/mock") as Record<string, unknown>;

  return {
    ...reanimatedMock,
    useSharedValue: (initialValue: number) => ({ value: initialValue }),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useReducedMotion: () => false,
    withSpring: (value: number) => value,
    withTiming: (value: number) => value,
  };
});

jest.mock("recyclerlistview", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const mockReactNative = jest.requireActual<typeof import("react-native")>("react-native");

  class DataProvider {
    _rows: MockDateRow[];

    constructor(_rowHasChanged: (left: unknown, right: unknown) => boolean) {
      this._rows = [];
    }

    cloneWithRows(rows: MockDateRow[]) {
      const next = new DataProvider(() => false);
      next._rows = rows;
      return next;
    }
  }

  class LayoutProvider {
    constructor(_getTypeForIndex: (index: number) => number, _setLayoutForType: (type: number, dim: unknown) => void) {}
  }

  const RecyclerListView = mockReact.forwardRef<MockRecyclerListViewRef, MockRecyclerListViewProps>((props, ref) => {
    const scrollToIndexMock: MockRecyclerListViewRef["scrollToIndex"] = jest.fn();

    mockReact.useImperativeHandle(ref, () => ({
      scrollToIndex: scrollToIndexMock,
    }));

    const rows = props.dataProvider?._rows ?? [];

    return mockReact.createElement(
      mockReactNative.View,
      { testID: "mock-recycler-list-view" },
      ...rows.map((item, index) =>
        mockReact.createElement(mockReact.Fragment, { key: item.date }, props.rowRenderer(0, item, index))
      )
    );
  });

  RecyclerListView.displayName = "MockRecyclerListView";

  return { DataProvider, LayoutProvider, RecyclerListView };
});

const getBackgroundColor = (testId: string) => {
  const touchable = screen.getByTestId(testId);
  const flattened = StyleSheet.flatten(touchable.props.style) as { backgroundColor?: string };
  return flattened?.backgroundColor;
};

describe("DateSlider", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockCurrentDate = TODAY;
    appStateChangeListener = null;
    mockStore = createMockStore();
    jest.spyOn(AppState, "addEventListener").mockImplementation((_eventType, listener) => {
      appStateChangeListener = listener as (state: string) => void;

      return {
        remove: jest.fn(() => {
          if (appStateChangeListener === listener) {
            appStateChangeListener = null;
          }
        }),
      };
    });
  });

  it("updates selected date and selected-item UI when a date is pressed", () => {
    render(<DateSlider />);

    const setSelectedDateMock = mockStore.getState().setSelectedDate as jest.Mock;

    expect(getBackgroundColor(`date-item-${TODAY}`)).toBe(BUTTON_PRIMARY_BG_COLOR);

    fireEvent.press(screen.getByTestId(`date-item-${PREVIOUS_DAY}`));

    expect(setSelectedDateMock).toHaveBeenCalledWith(PREVIOUS_DAY);
    expect(mockStore.getState().selectedDate).toBe(PREVIOUS_DAY);
    expect(getBackgroundColor(`date-item-${PREVIOUS_DAY}`)).toBe(BUTTON_PRIMARY_BG_COLOR);
    expect(getBackgroundColor(`date-item-${TODAY}`)).toBe(ACCENT_SOFT_BG_COLOR);
  });

  it("updates selected date with accessibilityTap activation", () => {
    render(<DateSlider />);

    const setSelectedDateMock = mockStore.getState().setSelectedDate as jest.Mock;
    const target = screen.getByTestId(`date-item-${PREVIOUS_DAY}`);

    fireEvent(target, "accessibilityTap");

    expect(setSelectedDateMock).toHaveBeenCalledWith(PREVIOUS_DAY);
    expect(mockStore.getState().selectedDate).toBe(PREVIOUS_DAY);
  });

  it("advances to the new current day when the app returns to foreground", () => {
    render(<DateSlider />);

    const setSelectedDateMock = mockStore.getState().setSelectedDate as jest.Mock;
    mockCurrentDate = NEXT_DAY;

    act(() => {
      appStateChangeListener?.("background");
      appStateChangeListener?.("active");
    });

    expect(setSelectedDateMock).toHaveBeenCalledWith(NEXT_DAY);
    expect(mockStore.getState().selectedDate).toBe(NEXT_DAY);
  });
});
