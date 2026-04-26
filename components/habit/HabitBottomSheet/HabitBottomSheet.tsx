import React from "react";
import { AppBottomSheet } from "@/components/ui";
import { useHabitStore } from "@/store/habitStore";
import type { Habit } from "@/types/habit";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing } from "@/constants/Spacing";
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
  const insets = useSafeAreaInsets();
  const habitId = habit?.id;
  const liveHabit = useHabitStore((state) => (habitId ? (state.habits[habitId] ?? null) : null));
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const updateCompletion = useHabitStore((state) => state.updateCompletion);
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const isCompleted = !!liveHabit?.completionHistory?.[selectedDate]?.isCompleted;
  const currentValue = liveHabit?.completionHistory?.[selectedDate]?.value || 0;

  const handleEdit = useCallback(() => {
    if (liveHabit) {
      router.push({
        pathname: "/add",
        params: { habitId: liveHabit.id },
      });
      onClose();
    }
  }, [liveHabit, onClose]);

  const handleDelete = useCallback(() => {
    if (liveHabit) {
      deleteHabit(liveHabit.id);
      onClose();
    }
  }, [liveHabit, deleteHabit, onClose]);

  const handleComplete = useCallback(() => {
    if (liveHabit) {
      if (liveHabit.completion.type === "simple") {
        updateCompletion({ id: liveHabit.id });
      } else if (liveHabit.completion.type === "repetitions" && liveHabit.completion.goal) {
        updateCompletion({ id: liveHabit.id, value: liveHabit.completion.goal });
      } else if (liveHabit.completion.type === "timed" && liveHabit.completion.goal) {
        updateCompletion({ id: liveHabit.id, value: liveHabit.completion.goal });
      }
      onClose();
    }
  }, [liveHabit, updateCompletion, onClose]);

  // Handle marking a habit as incomplete
  const handleReset = useCallback(() => {
    if (liveHabit) {
      updateCompletion({ id: liveHabit.id, value: 0 });
      onClose();
    }
  }, [liveHabit, updateCompletion, onClose]);

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

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isOpen) {
      // Small delay to allow BottomSheet to measure the newly rendered content
      timeoutId = setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 50);
    } else {
      bottomSheetRef.current?.close();
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  return (
    <AppBottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing={true}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
    >
      {!!liveHabit && (
        <BottomSheetView style={[styles.contentContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <HabitBottomSheetHeader habit={liveHabit} onClose={onClose} />
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
