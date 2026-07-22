import React from "react";
import { AppBottomSheet } from "@/components/ui";
import { useHabitStore } from "@/store/habitStore";
import type { Habit } from "@/types/habit";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing } from "@/constants/Spacing";
import styles from "./HabitBottomSheet.styles";

import HabitBottomSheetActions from "./HabitBottomSheetActions/HabitBottomSheetActions";
import HabitBottomSheetHeader from "./HabitBottomSheetHeader/HabitBottomSheetHeader";
import HabitBottomSheetStatus from "./HabitBottomSheetStatus/HabitBottomSheetStatus";

interface HabitBottomSheetProps {
  habit: Habit;
  onDismiss: () => void;
}

export default function HabitBottomSheet({ habit, onDismiss }: HabitBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const liveHabit = useHabitStore((state) => state.habits[habit.id] ?? null);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const updateCompletion = useHabitStore((state) => state.updateCompletion);
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const isCompleted = !!liveHabit?.completionHistory?.[selectedDate]?.isCompleted;
  const currentValue = liveHabit?.completionHistory?.[selectedDate]?.value || 0;

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleEdit = useCallback(() => {
    if (liveHabit) {
      router.push({
        pathname: "/add",
        params: { habitId: liveHabit.id },
      });
      closeBottomSheet();
    }
  }, [liveHabit, closeBottomSheet]);

  const handleDelete = useCallback(() => {
    if (liveHabit) {
      deleteHabit(liveHabit.id);
      closeBottomSheet();
    }
  }, [liveHabit, deleteHabit, closeBottomSheet]);

  const handleComplete = useCallback(() => {
    if (liveHabit) {
      if (liveHabit.completion.type === "simple") {
        updateCompletion({ id: liveHabit.id });
      } else if (liveHabit.completion.type === "repetitions" && liveHabit.completion.goal) {
        updateCompletion({ id: liveHabit.id, value: liveHabit.completion.goal });
      } else if (liveHabit.completion.type === "timed" && liveHabit.completion.goal) {
        updateCompletion({ id: liveHabit.id, value: liveHabit.completion.goal });
      }
      closeBottomSheet();
    }
  }, [liveHabit, updateCompletion, closeBottomSheet]);

  // Handle marking a habit as incomplete
  const handleReset = useCallback(() => {
    if (liveHabit) {
      updateCompletion({ id: liveHabit.id, value: 0 });
      closeBottomSheet();
    }
  }, [liveHabit, updateCompletion, closeBottomSheet]);

  const handleIncrement = useCallback(() => {
    if (liveHabit && liveHabit.completion.type === "repetitions") {
      updateCompletion({ id: liveHabit.id, value: currentValue + 1 });
    }
  }, [liveHabit, currentValue, updateCompletion]);

  const handleDecrement = useCallback(() => {
    if (liveHabit && liveHabit.completion.type === "repetitions" && currentValue > 0) {
      updateCompletion({ id: liveHabit.id, value: currentValue - 1 });
    }
  }, [liveHabit, currentValue, updateCompletion]);

  return (
    <AppBottomSheet
      ref={bottomSheetRef}
      index={0}
      enableDynamicSizing={true}
      onChange={(index) => {
        if (index === -1) onDismiss();
      }}
    >
      {!!liveHabit && (
        <BottomSheetView style={[styles.contentContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <HabitBottomSheetHeader habit={liveHabit} onClose={closeBottomSheet} />
          <HabitBottomSheetStatus habit={liveHabit} isCompleted={isCompleted} selectedDate={selectedDate} />
          <HabitBottomSheetActions
            habit={liveHabit}
            isCompleted={isCompleted}
            currentValue={currentValue}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleComplete={handleComplete}
            handleReset={handleReset}
            handleIncrement={handleIncrement}
            handleDecrement={handleDecrement}
          />
        </BottomSheetView>
      )}
    </AppBottomSheet>
  );
}
