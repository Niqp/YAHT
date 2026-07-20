import React from "react";
import { Platform } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import WheelPicker from "../WheelPicker";

const originalPlatform = Platform.OS;

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      textPrimary: "#ffffff",
      accent: "#55ccff",
      accentSoftBg: "#113344",
      pickerSelectionBg: "#225577",
    },
  }),
}));

jest.mock("@react-native-picker/picker", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const Picker = ({ children, selectedValue, onValueChange }: any) => (
    <View testID="ios-native-picker">
      <Text>{`selected:${String(selectedValue)}`}</Text>
      {React.Children.map(children, (child: React.ReactElement) => React.cloneElement(child, { onValueChange }))}
    </View>
  );

  Picker.Item = ({ label, value, onValueChange }: any) => <Text onPress={() => onValueChange?.(value)}>{label}</Text>;

  return { Picker };
});

jest.mock("@quidone/react-native-wheel-picker", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  const BaseWheelPicker = ({
    data,
    value,
    onValueChanged,
    renderItem,
    itemTextStyle,
    testID = "base-wheel-picker",
  }: any) => (
    <View testID={testID}>
      <Text>{`selected:${String(value)}`}</Text>
      {data.map((item: { value: number }, index: number) => (
        <Pressable key={item.value} onPress={() => onValueChanged?.({ item })}>
          {renderItem({ item, index, itemTextStyle })}
        </Pressable>
      ))}
    </View>
  );

  const withVirtualized = () => (props: any) => <BaseWheelPicker {...props} testID="virtualized-wheel-picker" />;

  return {
    __esModule: true,
    default: BaseWheelPicker,
    withVirtualized,
    usePickerItemHeight: () => 40,
  };
});

const setPlatform = (os: string) => {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: os,
  });
};

describe("WheelPicker", () => {
  beforeEach(() => {
    setPlatform(originalPlatform);
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it("uses the native iOS picker and maps onValueChange correctly", () => {
    setPlatform("ios");

    const handleChange = jest.fn();

    render(
      <WheelPicker
        values={[1, 2]}
        formatLabel={(value) => (value === 1 ? "One" : "Two")}
        value={1}
        onChange={handleChange}
      />
    );

    expect(screen.getByTestId("ios-native-picker")).toBeOnTheScreen();
    expect(screen.getByText("selected:1")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Two"));

    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it("renders labels lazily via renderItem on the non-iOS wheel", () => {
    setPlatform("android");

    const handleChange = jest.fn();
    const formatLabel = jest.fn((value: number) => `Item ${value}`);

    render(<WheelPicker values={[3, 4]} formatLabel={formatLabel} value={3} onChange={handleChange} />);

    expect(screen.getByTestId("base-wheel-picker")).toBeOnTheScreen();
    expect(screen.getByText("selected:3")).toBeOnTheScreen();
    expect(formatLabel).toHaveBeenCalledWith(3);
    expect(formatLabel).toHaveBeenCalledWith(4);

    fireEvent.press(screen.getByText("Item 4"));

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it("switches to the virtualized wheel automatically for large value ranges", () => {
    setPlatform("android");

    const values = Array.from({ length: 100 }, (_, index) => index + 1);

    render(<WheelPicker values={values} value={1} onChange={jest.fn()} />);

    expect(screen.getByTestId("virtualized-wheel-picker")).toBeOnTheScreen();
    // Default label falls back to String(value).
    expect(screen.getByText("42")).toBeOnTheScreen();
  });

  it("can keep a large wheel non-virtualized inside a ScrollView", () => {
    setPlatform("android");

    const values = Array.from({ length: 60 }, (_, index) => index);

    render(<WheelPicker values={values} value={0} onChange={jest.fn()} virtualized={false} />);

    expect(screen.getByTestId("base-wheel-picker")).toBeOnTheScreen();
    expect(screen.queryByTestId("virtualized-wheel-picker")).not.toBeOnTheScreen();
  });
});
