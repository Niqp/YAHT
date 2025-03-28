import HabitList from "@/components/HabitList/HabitList";
import { FloatingButton } from "@/components/buttons/FloatingButton";
import { router } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import DateSlider from "../../components/dateSlider/DateSlider";
import HabitBottomSheet from "../../components/habit/HabitBottomSheet/HabitBottomSheet";
import { useTheme } from "../../hooks/useTheme";
import { useHabitStore } from "../../store/habitStore";
import type { Habit } from "../../types/habit";
import { getCurrentDateStamp } from "@/utils/date";

export default function TodayScreen() {
  // Always call these hooks at the top level, before any early returns
  const { colors } = useTheme();

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const selectedDate = useHabitStore((state) => state.selectedDate);

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

  // Create UI elements
  const loadingView = (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DateSlider />

      {!isHydrated ? (
        loadingView
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
