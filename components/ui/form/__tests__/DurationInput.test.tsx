import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import DurationInput from "../DurationInput";

const wheelPickerCalls: Array<Record<string, unknown>> = [];

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      bgInset: "#111111",
      borderSubtle: "#333333",
      textSecondary: "#cccccc",
    },
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { count?: number }) => {
      if (typeof params?.count === "number") {
        return `${params.count} ${key}`;
      }

      return key;
    },
  }),
}));

jest.mock("../WheelPicker", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return function MockWheelPicker(props: {
    data: Array<{ label: string; value: number }>;
    onChange: (value: number) => void;
    virtualized?: boolean;
  }) {
    const callIndex = wheelPickerCalls.length;
    wheelPickerCalls.push(props);

    return (
      <View testID={`wheel-${callIndex}`}>
        <Text>{props.virtualized ? "virtualized" : "base"}</Text>
        <Pressable
          onPress={() => props.onChange(props.data[callIndex === 0 ? 2 : 1]?.value ?? props.data[0]?.value ?? 0)}
        >
          <Text>{`change-${callIndex}`}</Text>
        </Pressable>
      </View>
    );
  };
});

jest.mock("../PresetPills", () => {
  const React = require("react");
  const { View } = require("react-native");

  return function MockPresetPills() {
    return <View testID="preset-pills" />;
  };
});

describe("DurationInput", () => {
  beforeEach(() => {
    wheelPickerCalls.length = 0;
  });

  it("uses non-virtualized wheels so it can live inside scrollable form screens", () => {
    render(<DurationInput valueMs={60 * 60000} onChangeMs={jest.fn()} animateMount={false} />);

    expect(wheelPickerCalls).toHaveLength(2);
    expect(wheelPickerCalls.every((props) => props.virtualized !== true)).toBe(true);
    expect(screen.getAllByText("base")).toHaveLength(2);
  });

  it("keeps hour and minute wheel changes functional", () => {
    const handleChange = jest.fn();

    render(<DurationInput valueMs={60 * 60000} onChangeMs={handleChange} animateMount={false} />);

    fireEvent.press(screen.getByText("change-0"));
    fireEvent.press(screen.getByText("change-1"));

    expect(handleChange).toHaveBeenNthCalledWith(1, 120 * 60000);
    expect(handleChange).toHaveBeenNthCalledWith(2, 61 * 60000);
  });
});
