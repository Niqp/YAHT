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
  const { Text, View } = require("react-native");

  const BaseWheelPicker = ({ data, value, onValueChanged, testID = "base-wheel-picker" }: any) => (
    <View testID={testID}>
      <Text>{`selected:${String(value)}`}</Text>
      {data.map((item: { label: string; value: number }) => (
        <Text key={`${item.value}-${item.label}`} onPress={() => onValueChanged?.({ item })}>
          {item.label}
        </Text>
      ))}
    </View>
  );

  const withVirtualized = () => (props: any) => <BaseWheelPicker {...props} testID="virtualized-wheel-picker" />;

  return {
    __esModule: true,
    default: BaseWheelPicker,
    withVirtualized,
  };
});

describe("WheelPicker", () => {
  beforeEach(() => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatform,
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatform,
    });
  });

  it("uses the native iOS picker and maps onValueChange correctly", () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "ios",
    });

    const handleChange = jest.fn();

    render(
      <WheelPicker
        data={[
          { label: "One", value: 1 },
          { label: "Two", value: 2 },
        ]}
        value={1}
        onChange={handleChange}
        animateMount={false}
      />
    );

    expect(screen.getByTestId("ios-native-picker")).toBeOnTheScreen();
    expect(screen.getByText("selected:1")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Two"));

    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it("keeps using the existing non-iOS wheel picker path", () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    });

    const handleChange = jest.fn();

    render(
      <WheelPicker
        data={[
          { label: "Three", value: 3 },
          { label: "Four", value: 4 },
        ]}
        value={3}
        onChange={handleChange}
        virtualized
        animateMount={false}
      />
    );

    expect(screen.getByTestId("virtualized-wheel-picker")).toBeOnTheScreen();
    expect(screen.getByText("selected:3")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Four"));

    expect(handleChange).toHaveBeenCalledWith(4);
  });
});
