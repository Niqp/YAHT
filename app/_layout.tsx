import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { useTimerManager } from "@/hooks/timer/useTimerManager";
import { useReminderManager } from "@/hooks/habit/useReminderManager";
import { useTimeChangeManager } from "@/hooks/useTimeChangeManager";
import { useTheme } from "@/hooks/useTheme";

export default function RootLayout() {
  const { colors, isDarkMode } = useTheme();
  useTimerManager();
  useReminderManager();
  useTimeChangeManager();

  const stackScreenOptions = useMemo<NativeStackNavigationOptions>(
    () => ({
      headerShown: false,
      headerStyle: {
        backgroundColor: colors.bgSurface,
      },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: {
        color: colors.textPrimary,
      },
      contentStyle: {
        backgroundColor: colors.bgApp,
      },
    }),
    [colors.bgApp, colors.bgSurface, colors.textPrimary]
  );

  const navigationTheme = useMemo<Theme>(() => {
    const baseTheme = isDarkMode ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDarkMode,
      colors: {
        ...baseTheme.colors,
        primary: colors.accent,
        background: colors.bgApp,
        card: colors.bgSurface,
        text: colors.textPrimary,
        border: colors.borderDefault,
        notification: colors.accent,
      },
    };
  }, [
    colors.accent,
    colors.bgApp,
    colors.borderDefault,
    colors.bgSurface,
    colors.accent,
    colors.textPrimary,
    isDarkMode,
  ]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider value={navigationTheme}>
          <BottomSheetModalProvider>
            <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor="transparent" translucent />
            <Stack screenOptions={stackScreenOptions}>
              <Stack.Screen name="index" redirect />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="add"
                options={{
                  presentation: "modal",
                  headerShown: false,
                }}
              />
            </Stack>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
