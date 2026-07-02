import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Home, BarChart2, Settings } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";

import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";

const TAB_SCREENS = [
  {
    name: "today",
    renderIcon: (color: string, size: number) => <Home color={color} size={size} />,
  },
  {
    name: "stats",
    renderIcon: (color: string, size: number) => <BarChart2 color={color} size={size} />,
  },
  {
    name: "settings",
    renderIcon: (color: string, size: number) => <Settings color={color} size={size} />,
  },
] as const;

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const tabBarPlatformStyle = useMemo(
    () =>
      Platform.select({
        ios: {
          borderTopColor: colors.navBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        android: {
          elevation: 8,
          borderTopColor: colors.navBorder,
          borderTopWidth: 1,
        },
      }) ?? {},
    [colors.navBorder]
  );

  const screenOptions = useMemo<BottomTabNavigationOptions>(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.navItemActive,
      tabBarInactiveTintColor: colors.navItemIdle,
      tabBarStyle: {
        backgroundColor: colors.navBg,
        ...tabBarPlatformStyle,
        minHeight: 60,
      },
      tabBarLabelStyle: {
        ...Typography.small,
        paddingBottom: Spacing.xs,
      },
    }),
    [colors.navBg, colors.navItemActive, colors.navItemIdle, tabBarPlatformStyle]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      {TAB_SCREENS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            headerShown: false,
            title: t(`tabs.${tab.name}`),
            tabBarIcon: ({ color, size }) => tab.renderIcon(color, size),
            sceneStyle: {
              backgroundColor: tab.name === "today" ? colors.gradientHeaderStart : colors.bgApp,
            },
          }}
        />
      ))}
    </Tabs>
  );
}
