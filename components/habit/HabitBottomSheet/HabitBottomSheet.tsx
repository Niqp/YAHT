import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import type { Habit } from "@/types/habit";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import styles from "./HabitBottomSheet.styles";

import HabitBottomSheetActions from "./HabitBottomSheetActions/HabitBottomSheetActions";
import HabitBottomSheetHeader from "./HabitBottomSheetHeader/HabitBottomSheetHeader";
import HabitBottomSheetStatus from "./HabitBottomSheetStatus/HabitBottomSheetStatus";

interface HabitBottomSheetProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function HabitBottomSheet({ habit, isOpen, onClose }: HabitBottomSheetProps) {
  const { colors } = useTheme();
  const { deleteHabit, updateCompletion, selectedDate } = useHabitStore();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const isCompleted = !!habit?.completionHistory?.get(selectedDate)?.isCompleted;

  const handleEdit = useCallback(() => {
    if (habit) {
      router.push({
        pathname: "/add",
        params: { habitId: habit.id },
      });
      onClose();
    }
  }, [habit, onClose]);

  const handleDelete = useCallback(() => {
    if (habit) {
      deleteHabit(habit.id);
      onClose();
    }
  }, [habit, deleteHabit, onClose]);

  const handleComplete = useCallback(() => {
    if (habit) {
      if (habit.completion.type === "simple") {
        updateCompletion({ id: habit.id });
      } else if (habit.completion.type === "repetitions" && habit.completion.goal) {
        updateCompletion({ id: habit.id, value: habit.completion.goal });
      } else if (habit.completion.type === "timed" && habit.completion.goal) {
        updateCompletion({ id: habit.id, value: habit.completion.goal });
      }
      onClose();
    }
  }, [habit, updateCompletion, onClose]);

  // Handle marking a habit as incomplete
  const handleReset = useCallback(() => {
    if (habit) {
      updateCompletion({ id: habit.id, value: 0 });
      onClose();
    }
  }, [habit, updateCompletion, onClose]);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      enablePanDownToClose={true}
      index={0}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
      backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: colors.cardBackground }]}
      handleIndicatorStyle={[styles.indicator, { backgroundColor: colors.textTertiary }]}
    >
      {!!habit && (
        <BottomSheetView style={styles.contentContainer}>
          <>
            <HabitBottomSheetHeader habit={habit} onClose={onClose} />
            <HabitBottomSheetStatus habit={habit} isCompleted={isCompleted} selectedDate={selectedDate} />
            <HabitBottomSheetActions
              isCompleted={isCompleted}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleComplete={handleComplete}
              handleReset={handleReset}
            />
          </>
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}
