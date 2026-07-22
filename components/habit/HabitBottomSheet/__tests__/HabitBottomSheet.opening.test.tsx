import React from "react";
import type { ForwardedRef, ReactNode } from "react";
import type * as ReactNative from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import HabitBottomSheet from "../HabitBottomSheet";

const habit: Habit = {
  id: "habit-1",
  title: "Read",
  icon: "book",
  repetition: { type: RepetitionType.DAILY },
  completion: { type: CompletionType.SIMPLE },
  completionHistory: {},
  createdAt: "2026-01-01",
};

const mockState = {
  habits: { [habit.id]: habit },
  selectedDate: "2026-02-20",
  deleteHabit: jest.fn(),
  updateCompletion: jest.fn(),
};

jest.mock("@/store/habitStore", () => ({
  useHabitStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

const mockSheetClose = jest.fn();
let mockSheetOnChange: ((index: number) => void) | undefined;

jest.mock("@/components/ui", () => {
  const mockReact = jest.requireActual("react") as typeof React;
  const { Pressable, View } = jest.requireActual("react-native") as typeof ReactNative;

  return {
    AppBottomSheet: mockReact.forwardRef(
      (
        { children, index, onChange }: { children: ReactNode; index?: number; onChange?: (index: number) => void },
        ref: ForwardedRef<{ close: () => void }>
      ) => {
        mockReact.useImperativeHandle(ref, () => ({ close: mockSheetClose }));
        mockSheetOnChange = onChange;

        return index === 0 ? (
          <View testID="open-bottom-sheet">
            {children}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="finish close animation"
              onPress={() => onChange?.(-1)}
            />
          </View>
        ) : null;
      }
    ),
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const { View } = jest.requireActual("react-native") as typeof ReactNative;

  return {
    BottomSheetView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("../HabitBottomSheetHeader/HabitBottomSheetHeader", () => {
  const { Pressable } = jest.requireActual("react-native") as typeof ReactNative;

  return ({ onClose }: { onClose: () => void }) => (
    <Pressable accessibilityRole="button" accessibilityLabel="close sheet" onPress={onClose} />
  );
});
jest.mock("../HabitBottomSheetStatus/HabitBottomSheetStatus", () => () => null);
jest.mock("../HabitBottomSheetActions/HabitBottomSheetActions", () => () => null);

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

describe("HabitBottomSheet opening", () => {
  it("mounts an open sheet so dynamic sizing can wait for layout", () => {
    render(<HabitBottomSheet habit={habit} onDismiss={jest.fn()} />);

    expect(screen.getByTestId("open-bottom-sheet")).toBeOnTheScreen();
  });

  it("keeps the sheet mounted until its close animation finishes", () => {
    const onDismiss = jest.fn();
    render(<HabitBottomSheet habit={habit} onDismiss={onDismiss} />);

    fireEvent.press(screen.getByRole("button", { name: "close sheet" }));

    expect(mockSheetClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByTestId("open-bottom-sheet")).toBeOnTheScreen();

    act(() => {
      mockSheetOnChange?.(-1);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
