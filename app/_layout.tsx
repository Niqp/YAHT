import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { useTimerManager } from "@/hooks/timer/useTimerManager";
import { useTheme } from "@/hooks/useTheme";

const useSystemThemeSync = (updateSystemTheme: () => void, setupSystemThemeListener: () => () => void) => {
  useEffect(() => {
    updateSystemTheme();
    const unsubscribe = setupSystemThemeListener();

    return unsubscribe;
  }, [setupSystemThemeListener, updateSystemTheme]);
};

export default function RootLayout() {
  const { colors, isDarkMode, updateSystemTheme, setupSystemThemeListener } = useTheme();
  useTimerManager();
  useSystemThemeSync(updateSystemTheme, setupSystemThemeListener);

  const stackScreenOptions = useMemo<NativeStackNavigationOptions>(
    () => ({
      headerShown: false,
      headerStyle: {
        backgroundColor: colors.cardBackground,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        color: colors.text,
      },
      contentStyle: {
        backgroundColor: colors.background,
      },
    }),
    [colors.background, colors.cardBackground, colors.text]
  );

  const navigationTheme = useMemo<Theme>(() => {
    const baseTheme = isDarkMode ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDarkMode,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.cardBackground,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [colors.accent, colors.background, colors.border, colors.cardBackground, colors.primary, colors.text, isDarkMode]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
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
