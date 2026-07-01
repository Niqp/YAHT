import { Stack } from "expo-router";
import React, { useMemo } from "react";

import { useTheme } from "@/hooks/useTheme";

export default function AddHabitLayout() {
  const { colors } = useTheme();

  const screenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: colors.bgApp,
      },
      headerTitleStyle: {
        color: colors.textPrimary,
      },
      headerTintColor: colors.accent,
      headerShadowVisible: true,
      headerBackButtonDisplayMode: "minimal" as const,
      headerBackTitle: "",
      contentStyle: {
        backgroundColor: colors.bgApp,
      },
    }),
    [colors.accent, colors.bgApp, colors.textPrimary]
  );

  return <Stack screenOptions={screenOptions} />;
}
