import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import React from "react";
import { render } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";

let mockScreenOptions: BottomTabNavigationOptions | undefined;
const mockSafeAreaInsets = { bottom: 0, left: 0, right: 0, top: 0 };

jest.mock("expo-router", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");

  const Tabs = jest.fn(
    ({ children, screenOptions }: { children: React.ReactNode; screenOptions: BottomTabNavigationOptions }) => {
      mockScreenOptions = screenOptions;
      return mockReact.createElement(mockReact.Fragment, null, children);
    }
  ) as jest.Mock & { Screen: jest.Mock };
  Tabs.Screen = jest.fn(() => null);

  return { Tabs };
});

jest.mock("lucide-react-native", () => ({
  BarChart2: () => null,
  Home: () => null,
  Settings: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockSafeAreaInsets,
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      bgApp: "#ffffff",
      gradientHeaderStart: "#f8f8f8",
      navBg: "#111111",
      navBorder: "rgba(255,255,255,0.12)",
      navItemActive: "#ffffff",
      navItemIdle: "#999999",
      shadow: "rgba(0,0,0,0.6)",
    },
  }),
}));

jest.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import TabsLayout from "@/app/(tabs)/_layout";
import { Tabs } from "expo-router";

// React Native exposes OS as readonly, but these tests must exercise both platform branches.
const mutablePlatform = Platform as { OS: typeof Platform.OS };
describe("TabsLayout tab bar style", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    mutablePlatform.OS = originalOS;
    mockScreenOptions = undefined;
    Object.assign(mockSafeAreaInsets, { bottom: 0, left: 0, right: 0, top: 0 });
    (Tabs.Screen as jest.Mock).mockClear();
  });

  it("uses a native iOS top separator instead of a negative shadow", () => {
    mutablePlatform.OS = "ios";

    render(<TabsLayout />);

    expect(mockScreenOptions).toMatchObject({
      tabBarStyle: {
        backgroundColor: "#111111",
        borderTopColor: "rgba(255,255,255,0.12)",
        borderTopWidth: StyleSheet.hairlineWidth,
        minHeight: 55,
      },
    });
    expect(mockScreenOptions?.tabBarStyle).not.toHaveProperty("boxShadow");
    expect(mockScreenOptions?.tabBarStyle).not.toHaveProperty("shadowColor");
  });

  it("keeps Android tab content at full height above the bottom system inset", () => {
    mutablePlatform.OS = "android";
    mockSafeAreaInsets.bottom = 48;

    render(<TabsLayout />);

    expect(mockScreenOptions).toMatchObject({
      tabBarStyle: {
        height: 103,
        minHeight: 55,
      },
    });
  });

  it("keeps tab scene styles free of safe-area padding so sheet backdrops cover the full window", () => {
    Object.assign(mockSafeAreaInsets, { left: 4, right: 6, top: 48 });

    render(<TabsLayout />);

    const sceneStyles = (Tabs.Screen as jest.Mock).mock.calls.map(([props]) => props.options.sceneStyle);
    expect(sceneStyles).toEqual([
      { backgroundColor: "#f8f8f8" },
      { backgroundColor: "#ffffff" },
      { backgroundColor: "#ffffff" },
    ]);
  });
});
