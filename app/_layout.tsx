import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import TimerManager from "@/components/TimerManager";

export default function RootLayout() {
  const { colors, updateSystemTheme, setupSystemThemeListener } = useTheme();

  useEffect(() => {
    updateSystemTheme();
    const unsubscribe = setupSystemThemeListener();
    return () => {
      unsubscribe(); // Cleanup the listener on unmount
    };
  }, [setupSystemThemeListener, updateSystemTheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Add BottomSheetModalProvider to ensure proper rendering of bottom sheets */}
      <TimerManager />
      <BottomSheetModalProvider>
        <StatusBar backgroundColor="transparent" translucent />
        <SafeAreaProvider>
          <Stack
            screenOptions={{
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
            }}
          >
            <Stack.Screen name="index" redirect={true} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="add"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
