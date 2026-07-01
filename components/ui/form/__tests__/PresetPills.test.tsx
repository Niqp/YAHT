import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";

import PresetPills from "../PresetPills";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      chipBg: "#111111",
      chipBorder: "#222222",
      chipText: "#333333",
      chipSelectedBg: "#444444",
      chipSelectedBorder: "#555555",
      chipSelectedText: "#666666",
      ripple: "#777777",
    },
  }),
}));

describe("PresetPills", () => {
  const findPressableAncestor = (node: ReturnType<typeof screen.getByText>) => {
    let current = node.parent;

    while (current && typeof current.props.style !== "function") {
      current = current.parent;
    }

    if (!current) {
      throw new Error("Expected preset label to be inside a pressable pill");
    }

    return current;
  };

  it("lays out presets as a full-width equal-cell row", () => {
    render(
      <PresetPills
        options={[
          { label: "5 min", value: 5 },
          { label: "15 min", value: 15 },
          { label: "30 min", value: 30 },
          { label: "1 hr", value: 60 },
        ]}
        selectedValue={15}
        onSelect={jest.fn()}
      />
    );

    const pills = ["5 min", "15 min", "30 min", "1 hr"].map((label) => findPressableAncestor(screen.getByText(label)));
    const rowStyle = StyleSheet.flatten(pills[0].parent?.props.style);

    expect(rowStyle).toMatchObject({
      width: "100%",
      flexDirection: "row",
    });

    pills.forEach((pill) => {
      const pillStyle =
        typeof pill.props.style === "function"
          ? StyleSheet.flatten(pill.props.style({ pressed: false }))
          : StyleSheet.flatten(pill.props.style);

      expect(pillStyle).toMatchObject({
        flex: 1,
        minWidth: 0,
      });
    });
  });
});
