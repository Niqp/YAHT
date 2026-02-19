import HabitList from "@/components/HabitList/HabitList";
import { FloatingButton } from "@/components/buttons/FloatingButton";
import { router } from "expo-router";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import DateSlider from "../../components/dateSlider/DateSlider";
import HabitBottomSheet from "../../components/habit/HabitBottomSheet/HabitBottomSheet";
import { useTheme } from "../../hooks/useTheme";
import { useHabitStore } from "../../store/habitStore";
import type { Habit } from "../../types/habit";
import { getCurrentDateStamp } from "@/utils/date";

// Minimum time (ms) to show the loading indicator to prevent a jarring flash
const MIN_LOADING_MS = 300;

export default function TodayScreen() {
  const { colors } = useTheme();

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const selectedDate = useHabitStore((state) => state.selectedDate);

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

  useEffect(() => {
    const currentDate = getCurrentDateStamp();
    if (selectedDate !== currentDate) {
      useHabitStore.setState({ selectedDate: currentDate });
    }
  }, []);

  const navigateToAddHabit = useCallback(() => {
    router.push("/add");
  }, []);

  const handleHabitAction = useCallback((habit: Habit) => {
    setSelectedHabit(habit);
    setIsBottomSheetOpen(true);
  }, []);

  const closeBottomSheet = useCallback(() => {
    setIsBottomSheetOpen(false);
    setSelectedHabit(null);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DateSlider />

      {!showContent ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <HabitList handleHabitAction={handleHabitAction} navigateToAddHabit={navigateToAddHabit} />
          <FloatingButton navigateToAddHabit={navigateToAddHabit} />
          <HabitBottomSheet habit={selectedHabit} onClose={closeBottomSheet} isOpen={isBottomSheetOpen} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
