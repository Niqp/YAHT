import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert, Keyboard, Platform, ScrollView } from "react-native";

let mockPreventRemoveEnabled = false;
let mockPreventRemoveCallback: ((event: { data: { action: unknown } }) => void) | undefined;
let mockStackScreenOptions: Array<{ headerShown?: boolean }> = [];

const mockRouterBack = jest.fn();
const mockRouterCanGoBack = jest.fn(() => true);
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
const mockNavigationDispatch = jest.fn();
const preventedGoBackAction = { type: "GO_BACK" };

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
    Screen: ({
      options,
    }: {
      options?: { headerShown?: boolean; headerLeft?: () => React.ReactNode; headerRight?: () => React.ReactNode };
    }) => {
      mockStackScreenOptions.push(options ?? {});

      return (
        <>
          {options?.headerLeft?.()}
          {options?.headerRight?.()}
        </>
      );
    },
  },
  router: {
    back: () => {
      mockRouterBack();

      if (mockPreventRemoveEnabled) {
        mockPreventRemoveCallback?.({
          data: { action: preventedGoBackAction },
        });
      }
    },
    canGoBack: () => mockRouterCanGoBack(),
    replace: (path: string) => mockRouterReplace(path),
    push: (path: unknown) => mockRouterPush(path),
  },
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({
    dispatch: (action: unknown) => mockNavigationDispatch(action),
  }),
}));

jest.mock("@react-navigation/native", () => ({
  usePreventRemove: (enabled: boolean, callback: ((event: { data: { action: unknown } }) => void) | undefined) => {
    mockPreventRemoveEnabled = enabled;
    mockPreventRemoveCallback = callback;
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
      bgApp: "#111",
      bgSurface: "#222",
      textPrimary: "#fff",
      textSecondary: "#ccc",
      textTertiary: "#999",
      accent: "#6cf",
      borderSubtle: "#333",
      borderDefault: "#444",
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
    CompletionTypeSection: ({
      setCompletionType,
      setCompletionGoal,
    }: {
      setCompletionType: (value: unknown) => void;
      setCompletionGoal: (value: number) => void;
    }) => {
      const { CompletionType } = require("@/types/habit");

      return (
        <View>
          <Text>Completion Sheet</Text>
          <Pressable
            onPress={() => {
              setCompletionType(CompletionType.REPETITIONS);
            }}
          >
            <Text>Use repetitions</Text>
          </Pressable>
          <Pressable onPress={() => setCompletionGoal(3)}>
            <Text>Set repetition goal</Text>
          </Pressable>
        </View>
      );
    },
    RepetitionPatternSection: ({
      setRepetitionType,
      setSelectedDays,
    }: {
      setRepetitionType: (value: unknown) => void;
      setSelectedDays: (value: number[]) => void;
    }) => {
      const { RepetitionType } = require("@/types/habit");

      return (
        <View>
          <Text>Repetition Sheet</Text>
          <Pressable
            onPress={() => {
              setRepetitionType(RepetitionType.WEEKDAYS);
              setSelectedDays([1, 3, 5]);
            }}
          >
            <Text>Use weekdays</Text>
          </Pressable>
        </View>
      );
    },
    ReminderSection: ({
      setEnabled,
      setHour,
      setMinute,
    }: {
      setEnabled: (value: boolean) => void;
      setHour: (value: number) => void;
      setMinute: (value: number) => void;
    }) => (
      <View>
        <Text>Reminder Sheet</Text>
        <Pressable
          onPress={() => {
            setEnabled(true);
            setHour(18);
            setMinute(45);
          }}
        >
          <Text>Use evening reminder</Text>
        </Pressable>
      </View>
    ),
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
  ChevronLeft: () => null,
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
import CompletionRoute from "@/app/add/completion";
import ReminderRoute from "@/app/add/reminder";
import RepetitionRoute from "@/app/add/repetition";
import { useAddHabitDraftStore } from "@/store/addHabitDraftStore";
import { CompletionType, RepetitionType } from "@/types/habit";

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
    mockStackScreenOptions = [];
    mockPreventRemoveEnabled = false;
    mockPreventRemoveCallback = undefined;
    mockStoreState.error = null;
    useAddHabitDraftStore.getState().resetForCreate();
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
    expect(mockPreventRemoveEnabled).toBe(true);

    const pendingAction = { type: "GO_BACK" };

    act(() => {
      mockPreventRemoveCallback?.({
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

  it("saves and closes without showing the discard alert", async () => {
    mockStoreState.addHabit.mockResolvedValueOnce(undefined);

    render(<AddEditHabitScreen />);

    fireEvent.changeText(screen.getByTestId("title-input"), "Read");

    await act(async () => {
      fireEvent.press(screen.getByText("Create Habit"));
    });

    expect(mockStoreState.addHabit).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockNavigationDispatch).toHaveBeenCalledWith(preventedGoBackAction);
  });

  it("keeps using the discard sheet on Android cancel when the form is dirty", () => {
    setPlatform("android");
    render(<AddEditHabitScreen />);

    fireEvent.changeText(screen.getByTestId("title-input"), "Read");
    fireEvent.press(screen.getByText("Cancel"));

    expect(screen.getByText("Discard Changes Sheet")).toBeOnTheScreen();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("opens setup panels as native add-flow routes", () => {
    render(<AddEditHabitScreen />);

    fireEvent.press(screen.getByText("Habit type"));
    fireEvent.press(screen.getByText("Repeatability"));
    fireEvent.press(screen.getByText("Reminders"));

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, { pathname: "/add/completion", params: undefined });
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, { pathname: "/add/repetition", params: undefined });
    expect(mockRouterPush).toHaveBeenNthCalledWith(3, { pathname: "/add/reminder", params: undefined });
    expect(screen.queryByTestId("mock-app-bottom-sheet")).toBeNull();
    expect(screen.getByText("Create Habit")).toBeOnTheScreen();
  });

  it("does not own native header visibility from the add index screen", () => {
    render(<AddEditHabitScreen />);

    fireEvent.press(screen.getByText("Habit type"));

    expect(mockStackScreenOptions.some((options) => Object.hasOwn(options, "headerShown"))).toBe(false);
  });

  it("keeps completion route edits local until Save is pressed", () => {
    render(<CompletionRoute />);

    fireEvent.press(screen.getByText("Use repetitions"));
    fireEvent.press(screen.getByText("Set repetition goal"));

    expect(useAddHabitDraftStore.getState().completionType).toBe(CompletionType.SIMPLE);
    expect(useAddHabitDraftStore.getState().repetitionGoal).toBe(1);

    fireEvent.press(screen.getByText("Save"));

    expect(useAddHabitDraftStore.getState().completionType).toBe(CompletionType.REPETITIONS);
    expect(useAddHabitDraftStore.getState().repetitionGoal).toBe(3);
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("keeps repetition route edits local until Save is pressed", () => {
    render(<RepetitionRoute />);

    fireEvent.press(screen.getByText("Use weekdays"));

    expect(useAddHabitDraftStore.getState().repetitionType).toBe(RepetitionType.DAILY);
    expect(useAddHabitDraftStore.getState().selectedDays).toEqual([]);

    fireEvent.press(screen.getByText("Save"));

    expect(useAddHabitDraftStore.getState().repetitionType).toBe(RepetitionType.WEEKDAYS);
    expect(useAddHabitDraftStore.getState().selectedDays).toEqual([1, 3, 5]);
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("keeps reminder route edits local until Save is pressed", async () => {
    render(<ReminderRoute />);

    await act(async () => {
      fireEvent.press(screen.getByText("Use evening reminder"));
    });

    expect(useAddHabitDraftStore.getState().reminderEnabled).toBe(false);
    expect(useAddHabitDraftStore.getState().reminderHour).toBe(9);
    expect(useAddHabitDraftStore.getState().reminderMinute).toBe(0);

    fireEvent.press(screen.getByText("Save"));

    expect(useAddHabitDraftStore.getState().reminderEnabled).toBe(true);
    expect(useAddHabitDraftStore.getState().reminderHour).toBe(18);
    expect(useAddHabitDraftStore.getState().reminderMinute).toBe(45);
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("does not wrap virtualized wheel detail routes in plain ScrollViews", () => {
    const completion = render(<CompletionRoute />);
    expect(completion.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
    completion.unmount();

    const repetition = render(<RepetitionRoute />);
    expect(repetition.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
  });
});
