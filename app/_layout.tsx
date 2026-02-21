import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useTimerManager } from "@/hooks/timer/useTimerManager";
import { useTheme } from "@/hooks/useTheme";

const ROOT_STACK_SCREENS = (
  <>
    <Stack.Screen name="index" redirect />
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen
      name="add"
      options={{
        presentation: "modal",
        headerShown: false,
      }}
    />
  </>
);

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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <BottomSheetModalProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor="transparent" translucent />
        <SafeAreaProvider>
          <Stack screenOptions={stackScreenOptions}>{ROOT_STACK_SCREENS}</Stack>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
