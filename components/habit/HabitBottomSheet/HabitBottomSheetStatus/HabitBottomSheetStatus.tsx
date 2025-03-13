import { useTheme } from "@/hooks/useTheme";
import { Text, View } from "react-native";
import styles from "./HabitBottomSheetStatus.styles";

const HabitBottomSheetStatus = ({
	isCompleted,
	selectedDate,
}: { isCompleted: boolean; selectedDate: string }) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.statusSection, { backgroundColor: colors.input }]}>
			<Text style={[styles.statusText, { color: colors.textSecondary }]}>
				Status: {isCompleted ? "Completed" : "Not completed"} for {selectedDate}
			</Text>
		</View>
	);
};
export default HabitBottomSheetStatus;
