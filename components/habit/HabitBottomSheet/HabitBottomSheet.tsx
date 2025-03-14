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

export default function HabitBottomSheet({
	habit,
	isOpen,
	onClose,
}: HabitBottomSheetProps) {
	const { colors } = useTheme();
	const { deleteHabit, completeHabit, selectedDate } = useHabitStore();
	const bottomSheetRef = useRef<BottomSheet>(null);

	const isCompleted =
		habit?.completionHistory?.[selectedDate]?.completed || false;

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
			if (habit.completionType === "simple") {
				completeHabit(habit.id, undefined, true);
			} else if (
				habit.completionType === "repetitions" &&
				habit.completionGoal
			) {
				completeHabit(habit.id, habit.completionGoal, true);
			} else if (habit.completionType === "timed" && habit.completionGoal) {
				completeHabit(habit.id, habit.completionGoal, true);
			}
			onClose();
		}
	}, [habit, completeHabit, onClose]);

	// Handle marking a habit as incomplete
	const handleSkip = useCallback(() => {
		if (habit) {
			completeHabit(habit.id, 0, false);
			onClose();
		}
	}, [habit, completeHabit, onClose]);

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
			backgroundStyle={[
				styles.bottomSheetBackground,
				{ backgroundColor: colors.cardBackground },
			]}
			handleIndicatorStyle={[
				styles.indicator,
				{ backgroundColor: colors.textTertiary },
			]}
		>
			{!!habit && (
				<BottomSheetView style={styles.contentContainer}>
					<>
						<HabitBottomSheetHeader habit={habit} onClose={onClose} />
						<HabitBottomSheetStatus
							habit={habit}
							isCompleted={isCompleted}
							selectedDate={selectedDate}
						/>
						<HabitBottomSheetActions
							isCompleted={isCompleted}
							handleEdit={handleEdit}
							handleDelete={handleDelete}
							handleComplete={handleComplete}
							handleSkip={handleSkip}
						/>
					</>
				</BottomSheetView>
			)}
		</BottomSheet>
	);
}
