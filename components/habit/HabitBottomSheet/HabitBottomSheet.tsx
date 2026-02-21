import React from "react";
import { AppBottomSheet } from "@/components/ui";
import { useHabitStore } from "@/store/habitStore";
import type { Habit } from "@/types/habit";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
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
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const updateCompletion = useHabitStore((state) => state.updateCompletion);
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const isCompleted = !!habit?.completionHistory?.[selectedDate]?.isCompleted;

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
    <AppBottomSheet
      ref={bottomSheetRef}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
    >
      {!!habit && (
        <BottomSheetView style={styles.contentContainer}>
          <HabitBottomSheetHeader habit={habit} onClose={onClose} />
          <HabitBottomSheetStatus habit={habit} isCompleted={isCompleted} selectedDate={selectedDate} />
          <HabitBottomSheetActions
            isCompleted={isCompleted}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleComplete={handleComplete}
            handleReset={handleReset}
          />
        </BottomSheetView>
      )}
    </AppBottomSheet>
  );
}
