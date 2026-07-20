import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Home, BarChart2, Settings } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";

const TAB_BAR_CONTENT_HEIGHT = 55;

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
  const insets = useSafeAreaInsets();

  const tabBarPlatformStyle = useMemo(() => {
    if (Platform.OS === "android") {
      return {
        elevation: 8,
        borderTopColor: colors.navBorder,
        borderTopWidth: 1,
        height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
      };
    }

    if (Platform.OS === "ios") {
      return {
        borderTopColor: colors.navBorder,
        borderTopWidth: StyleSheet.hairlineWidth,
      };
    }

    return {};
  }, [colors.navBorder, insets.bottom]);

  const screenOptions = useMemo<BottomTabNavigationOptions>(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.navItemActive,
      tabBarInactiveTintColor: colors.navItemIdle,
      tabBarStyle: {
        backgroundColor: colors.navBg,
        ...tabBarPlatformStyle,
        minHeight: TAB_BAR_CONTENT_HEIGHT,
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
