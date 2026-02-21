import React from "react";
import { Tabs } from "expo-router";
import { Home, BarChart2, Settings } from "lucide-react-native";
import { SafeAreaView, Platform } from "react-native";
import { StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function TabsLayout() {
  const { colors } = useTheme();

  // Platform-specific shadow styles that ensure visibility
  const tabBarShadow = Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      borderTopWidth: 0,
    },
    android: {
      elevation: 8, // Higher elevation to ensure visibility
      borderTopWidth: 1, // Subtle border for Android
      borderColor: colors.border,
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.tabBackground,
            ...tabBarShadow,
            height: 60, // Slightly taller for better touch targets
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            paddingBottom: 4,
          },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
