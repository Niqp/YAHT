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
    i18n: { language: "en" },
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
    values: ReadonlyArray<number>;
    formatLabel?: (value: number) => string;
    onChange: (value: number) => void;
  }) {
    const callIndex = wheelPickerCalls.length;
    wheelPickerCalls.push(props);

    return (
      <View testID={`wheel-${callIndex}`}>
        <Pressable onPress={() => props.onChange(props.values[callIndex === 0 ? 2 : 1] ?? props.values[0] ?? 0)}>
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

  it("passes value ranges with lazy label formatters to the wheels", () => {
    render(<DurationInput valueMs={60 * 60000} onChangeMs={jest.fn()} />);

    expect(wheelPickerCalls).toHaveLength(2);

    const [hourWheel, minuteWheel] = wheelPickerCalls as Array<{
      values: ReadonlyArray<number>;
      formatLabel: (value: number) => string;
    }>;

    expect(hourWheel.values).toHaveLength(24);
    expect(minuteWheel.values).toHaveLength(60);
    expect(hourWheel.formatLabel(2)).toBe("2 addHabit.units.hr");
    expect(minuteWheel.formatLabel(30)).toBe("30 addHabit.units.min");
  });

  it("hides the zero-minute option while the hour wheel is at zero", () => {
    render(<DurationInput valueMs={5 * 60000} onChangeMs={jest.fn()} />);

    const minuteWheel = wheelPickerCalls[1] as { values: ReadonlyArray<number> };

    expect(minuteWheel.values).toHaveLength(59);
    expect(minuteWheel.values[0]).toBe(1);
  });

  it("keeps hour and minute wheel changes functional", () => {
    const handleChange = jest.fn();

    render(<DurationInput valueMs={60 * 60000} onChangeMs={handleChange} />);

    fireEvent.press(screen.getByText("change-0"));
    fireEvent.press(screen.getByText("change-1"));

    expect(handleChange).toHaveBeenNthCalledWith(1, 120 * 60000);
    expect(handleChange).toHaveBeenNthCalledWith(2, 61 * 60000);
  });
});
