import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Home, BarChart2, Settings } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform } from "react-native";

import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";

const TAB_SCREENS = [
  {
    name: "today",
    title: "Today",
    renderIcon: (color: string, size: number) => <Home color={color} size={size} />,
  },
  {
    name: "stats",
    title: "Stats",
    renderIcon: (color: string, size: number) => <BarChart2 color={color} size={size} />,
  },
  {
    name: "settings",
    title: "Settings",
    renderIcon: (color: string, size: number) => <Settings color={color} size={size} />,
  },
] as const;

export default function TabsLayout() {
  const { colors } = useTheme();

  const tabBarShadow = useMemo(
    () =>
      Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          borderTopWidth: 0,
        },
        android: {
          elevation: 8,
          borderTopWidth: 1,
          borderColor: colors.border,
        },
      }) ?? {},
    [colors.border, colors.shadow]
  );

  const screenOptions = useMemo<BottomTabNavigationOptions>(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabIconDefault,
      tabBarStyle: {
        backgroundColor: colors.tabBackground,
        ...tabBarShadow,
        minHeight: 60,
      },
      tabBarLabelStyle: {
        ...Typography.small,
        paddingBottom: Spacing.xs,
      },
    }),
    [colors.primary, colors.tabBackground, colors.tabIconDefault, tabBarShadow]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      {TAB_SCREENS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            headerShown: false,
            title: tab.title,
            tabBarIcon: ({ color, size }) => tab.renderIcon(color, size),
          }}
        />
      ))}
    </Tabs>
  );
}
