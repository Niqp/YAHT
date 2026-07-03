import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { useTimerManager } from "@/hooks/timer/useTimerManager";
import { useReminderManager } from "@/hooks/habit/useReminderManager";
import { useTimeChangeManager } from "@/hooks/useTimeChangeManager";
import { useTheme } from "@/hooks/useTheme";
import { initializeI18n, syncI18nToDeviceLocale } from "@/i18n";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";

initializeI18n();
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const { colors, isDarkMode } = useTheme();
  useTimerManager();
  useReminderManager();
  useTimeChangeManager();

  useEffect(() => {
    void SplashScreen.hideAsync().catch((error) =>
      logError("app.splash.hide.failed", { operation: "hideSplashScreen", error })
    );
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      logEvent("app.state.changed", { appState: nextState });
      if (nextState === "active") {
        void syncI18nToDeviceLocale()
          .then(() => logEvent("locale.sync.completed", { appState: nextState }))
          .catch((error) => logError("locale.sync.failed", { operation: "syncI18nToDeviceLocale", error }));
      }
    });

    return () => subscription.remove();
  }, []);

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
