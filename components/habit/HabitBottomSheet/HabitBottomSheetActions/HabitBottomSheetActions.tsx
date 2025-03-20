import { useTheme } from "@/hooks/useTheme";
import { Edit, Trash2, Check, RotateCcw } from "lucide-react-native";
import { View, TouchableOpacity, Text } from "react-native";
import styles from "./HabitBottomSheetActions.styles";

interface HabitBottomSheetActionsProps {
	isCompleted: boolean;
	handleEdit: () => void;
	handleDelete: () => void;
	handleComplete: () => void;
	handleReset: () => void;
}

export default function HabitBottomSheetActions({
	isCompleted,
	handleEdit,
	handleDelete,
	handleComplete,
	handleReset,
}: HabitBottomSheetActionsProps) {
	const { colors } = useTheme();
	return (
		<View style={styles.actionsContainer}>
			<TouchableOpacity
				style={[styles.actionButton, { backgroundColor: colors.input }]}
				onPress={handleEdit}
				activeOpacity={0.7}
			>
				<Edit size={24} color={colors.primary} />
				<Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[styles.actionButton, { backgroundColor: colors.input }]}
				onPress={handleDelete}
				activeOpacity={0.7}
			>
				<Trash2 size={24} color={colors.error} />
				<Text style={[styles.actionText, { color: colors.text }]}>Delete</Text>
			</TouchableOpacity>

			{!isCompleted ? (
				<TouchableOpacity
					style={[styles.actionButton, { backgroundColor: colors.input }]}
					onPress={handleComplete}
					activeOpacity={0.7}
				>
					<Check size={24} color={colors.success} />
					<Text style={[styles.actionText, { color: colors.text }]}>
						Complete
					</Text>
				</TouchableOpacity>
			) : (
				<TouchableOpacity
					style={[styles.actionButton, { backgroundColor: colors.input }]}
					onPress={handleReset}
					activeOpacity={0.7}
				>
					<RotateCcw size={24} color={colors.textSecondary} />
					<Text style={[styles.actionText, { color: colors.text }]}>
						Reset
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}
