import HabitList from "@/components/HabitList/HabitList";
import { FloatingButton } from "@/components/buttons/FloatingButton";
import DateSlider from "@/components/dateSlider/DateSlider";
import HabitBottomSheet from "@/components/habit/HabitBottomSheet/HabitBottomSheet";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import type { Habit } from "@/types/habit";
import { router } from "expo-router";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Minimum time (ms) to show the loading indicator to prevent a jarring flash
const MIN_LOADING_MS = 300;

export default function TodayScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const isHydrated = useHabitStore((state) => state._hasHydrated);

  // Prevent loading flash: only hide the spinner after MIN_LOADING_MS has passed
  const [showContent, setShowContent] = useState(false);
  const minDelayPassed = useRef(false);
  const hydrationReady = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      minDelayPassed.current = true;
      if (hydrationReady.current) {
        setShowContent(true);
      }
    }, MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      hydrationReady.current = true;
      if (minDelayPassed.current) {
        setShowContent(true);
      }
    }
  }, [isHydrated]);

  const navigateToAddHabit = useCallback(() => {
    router.push("/add");
  }, []);

  const handleHabitAction = useCallback((habit: Habit) => {
    setSelectedHabit(habit);
  }, []);

  const dismissBottomSheet = useCallback(() => {
    setSelectedHabit(null);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.gradientHeaderStart }]}>
      <View
        style={[
          styles.safeAreaContent,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <DateSlider />

        <View style={[styles.bodyContent, { backgroundColor: colors.bgApp }]}>
          {!showContent ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <>
              <HabitList handleHabitAction={handleHabitAction} />
              <FloatingButton navigateToAddHabit={navigateToAddHabit} />
            </>
          )}
        </View>
      </View>
      {showContent && selectedHabit ? <HabitBottomSheet habit={selectedHabit} onDismiss={dismissBottomSheet} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
  bodyContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
