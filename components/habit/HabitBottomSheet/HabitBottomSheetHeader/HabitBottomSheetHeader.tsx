import styles from "./HabitBottomSheetHeader.styles";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronUp } from "lucide-react-native";
import type { Habit } from "@/types/habit";

export default function HabitBottomSheetHeader({
	habit,
	onClose,
}: { habit: Habit; onClose: () => void }) {
	const { colors } = useTheme();
	return (
		<View style={styles.headerContainer}>
			<View style={[styles.iconContainer, { backgroundColor: colors.input }]}>
				<Text style={styles.habitIcon}>{habit.icon}</Text>
			</View>
			<View style={styles.habitInfoContainer}>
				<Text style={[styles.habitTitle, { color: colors.text }]}>
					{habit.title}
				</Text>
				<Text style={[styles.habitSubtitle, { color: colors.textSecondary }]}>
					{habit.completion.type === "simple"
						? "Goal: complete once"
						: habit.completion.type === "repetitions"
							? `Goal: ${habit.completion.goal || 0} repetitions`
							: `Goal: ${Math.floor((habit.completion.goal || 0) / 60)} minutes`}
				</Text>
			</View>
			<TouchableOpacity
				style={[styles.closeButton, { backgroundColor: colors.input }]}
				onPress={onClose}
			>
				<ChevronUp size={20} color={colors.textSecondary} />
			</TouchableOpacity>
		</View>
	);
}
