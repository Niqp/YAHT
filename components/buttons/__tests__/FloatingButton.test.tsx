import React from "react";
import { render, screen } from "@testing-library/react-native";

import { FloatingButton } from "../FloatingButton";

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      buttonPrimaryText: "#2F1F1A",
      gradientFabEnd: "#B98D62",
      gradientFabStart: "#C79770",
      shadow: "rgba(47,31,26,0.055)",
      textOnAccent: "#FFFFFF",
    },
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const { View } = require("react-native");

    return <View>{children}</View>;
  },
}));

jest.mock("lucide-react-native", () => ({
  Plus: ({ color }: { color: string }) => {
    const { Text } = require("react-native");

    return <Text testID="floating-button-plus-icon" color={color} />;
  },
}));

describe("FloatingButton", () => {
  it("uses the on-accent text color for the add icon", () => {
    render(<FloatingButton navigateToAddHabit={jest.fn()} />);

    expect(screen.getByTestId("floating-button-plus-icon").props.color).toBe("#FFFFFF");
  });
});
