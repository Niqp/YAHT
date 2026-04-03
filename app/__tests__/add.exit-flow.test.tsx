import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, Keyboard, Platform } from "react-native";

let preventRemoveEnabled = false;
let preventRemoveCallback: ((event: { data: { action: unknown } }) => void) | undefined;

const mockRouterBack = jest.fn();
const mockRouterCanGoBack = jest.fn(() => true);
const mockRouterReplace = jest.fn();
const mockNavigationDispatch = jest.fn();

const mockStoreState = {
  _hasHydrated: true,
  habits: {},
  addHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  error: null as string | null,
};

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  router: {
    back: () => mockRouterBack(),
    canGoBack: () => mockRouterCanGoBack(),
    replace: (path: string) => mockRouterReplace(path),
  },
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({
    dispatch: (action: unknown) => mockNavigationDispatch(action),
  }),
}));

jest.mock("@react-navigation/native", () => ({
  usePreventRemove: (enabled: boolean, callback: ((event: { data: { action: unknown } }) => void) | undefined) => {
    preventRemoveEnabled = enabled;
    preventRemoveCallback = callback;
  },
}));

jest.mock("@/store/habitStore", () => {
  const useHabitStore: any = (selector: any) => selector(mockStoreState);
  useHabitStore.getState = () => mockStoreState;
  return { useHabitStore };
});

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      background: "#111",
      cardBackground: "#222",
      text: "#fff",
      textSecondary: "#ccc",
      textTertiary: "#999",
      primary: "#6cf",
      divider: "#333",
      border: "#444",
      shadow: "#000",
    },
    weekStartDay: 1,
  }),
}));

jest.mock("@/utils/notifications", () => ({
  prepareReminderNotifications: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("@/components/ui", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  const AppBottomSheet = React.forwardRef(
    ({ children, onClose }: { children: React.ReactNode; onClose?: () => void }, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        close: () => onClose?.(),
      }));

      return <View testID="mock-app-bottom-sheet">{children}</View>;
    }
  );

  return {
    AppBottomSheet,
    AppText: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    ScaleButton: ({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) => (
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

jest.mock("@/components/ui/form", () => ({
  WheelPicker: () => null,
}));

jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    __esModule: true,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("@/components/habitForm", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");

  return {
    BasicInfoSection: ({
      title,
      setTitle,
      errorMessage,
    }: {
      title: string;
      setTitle: (value: string) => void;
      errorMessage?: string | null;
    }) => (
      <View>
        <TextInput testID="title-input" value={title} onChangeText={setTitle} />
        {errorMessage ? <Text>{errorMessage}</Text> : null}
      </View>
    ),
    CompletionTypeSection: () => <Text>Completion Sheet</Text>,
    RepetitionPatternSection: () => <Text>Repetition Sheet</Text>,
    ReminderSection: () => <Text>Reminder Sheet</Text>,
    DiscardChangesSheet: ({
      isOpen,
      onClose,
      onDiscard,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onDiscard: () => void;
    }) =>
      isOpen ? (
        <View>
          <Text>Discard Changes Sheet</Text>
          <Pressable onPress={onDiscard}>
            <Text>Discard Sheet CTA</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text>Keep Editing Sheet CTA</Text>
          </Pressable>
        </View>
      ) : null,
    SheetTriggerCard: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

jest.mock("lucide-react-native", () => ({
  CalendarDays: () => null,
  CheckSquare: () => null,
  Bell: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

import AddEditHabitScreen from "@/app/add";

const originalPlatform = Platform.OS;

const setPlatform = (os: "ios" | "android") => {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: os,
  });
};

const getLatestAlertButtons = () => {
  const latestCall = (Alert.alert as jest.Mock).mock.calls.at(-1);
  return (latestCall?.[2] ?? []) as Array<{ text?: string; onPress?: () => void }>;
};

describe("AddEditHabitScreen exit flow", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    preventRemoveEnabled = false;
    preventRemoveCallback = undefined;
    mockStoreState.error = null;
    setPlatform("ios");
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    jest.spyOn(Keyboard, "addListener").mockImplementation(() => ({ remove: jest.fn() }) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatform,
    });
  });

  it("leaves immediately when cancel is pressed without unsaved changes", () => {
    render(<AddEditHabitScreen />);

    fireEvent.press(screen.getByText("Cancel"));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("shows a native discard alert on iOS cancel when the form is dirty", () => {
    render(<AddEditHabitScreen />);

    fireEvent.changeText(screen.getByTestId("title-input"), "Read");
    fireEvent.press(screen.getByText("Cancel"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Discard changes?",
      "Your new habit has not been saved yet.",
      expect.any(Array)
    );
    expect(screen.queryByText("Discard Changes Sheet")).toBeNull();

    const keepEditingButton = getLatestAlertButtons().find((button) => button.text === "Keep Editing");
    act(() => {
      keepEditingButton?.onPress?.();
    });

    expect(mockRouterBack).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText("Cancel"));

    const discardButton = getLatestAlertButtons().find((button) => button.text === "Discard");
    act(() => {
      discardButton?.onPress?.();
    });
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("intercepts iOS swipe dismiss, confirms, and resumes the pending navigation action once", () => {
    render(<AddEditHabitScreen />);

    fireEvent.changeText(screen.getByTestId("title-input"), "Read");
    expect(preventRemoveEnabled).toBe(true);

    const pendingAction = { type: "GO_BACK" };

    act(() => {
      preventRemoveCallback?.({
        data: { action: pendingAction },
      });
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);

    const discardButton = getLatestAlertButtons().find((button) => button.text === "Discard");
    act(() => {
      discardButton?.onPress?.();
    });

    expect(mockNavigationDispatch).toHaveBeenCalledTimes(1);
    expect(mockNavigationDispatch).toHaveBeenCalledWith(pendingAction);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps using the discard sheet on Android cancel when the form is dirty", () => {
    setPlatform("android");
    render(<AddEditHabitScreen />);

    fireEvent.changeText(screen.getByTestId("title-input"), "Read");
    fireEvent.press(screen.getByText("Cancel"));

    expect(screen.getByText("Discard Changes Sheet")).toBeOnTheScreen();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("closes an inner setup sheet before allowing route dismissal", () => {
    render(<AddEditHabitScreen />);

    fireEvent.press(screen.getByText("Habit type"));
    expect(screen.getByText("Completion Sheet")).toBeOnTheScreen();
    expect(preventRemoveEnabled).toBe(true);

    act(() => {
      preventRemoveCallback?.({
        data: { action: { type: "GO_BACK" } },
      });
    });

    expect(screen.queryByText("Completion Sheet")).toBeNull();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockNavigationDispatch).not.toHaveBeenCalled();
    expect(mockRouterBack).not.toHaveBeenCalled();
  });
});
