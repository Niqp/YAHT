import { useTheme } from "@/hooks/useTheme";
import type { RepetitionType } from "@/types/habit";
import { getOrderedWeekDays } from "@/utils/date";
import type React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "./RepetitionPatternSection.styles";

interface RepetitionPatternSectionProps {
	repetitionType: RepetitionType;
	setRepetitionType: (type: RepetitionType) => void;
	selectedDays: number[];
	setSelectedDays: (days: number[]) => void;
	customDays: number;
	setCustomDays: (days: number) => void;
	weekStartDay: number;
}

const RepetitionPatternSection: React.FC<RepetitionPatternSectionProps> = ({
	repetitionType,
	setRepetitionType,
	selectedDays,
	setSelectedDays,
	customDays,
	setCustomDays,
	weekStartDay,
}) => {
	const { colors } = useTheme();

	// Get weekdays ordered according to the weekStartDay preference
	const WEEKDAYS = getOrderedWeekDays(weekStartDay);

	const handleDayToggle = (day: number) => {
		if (selectedDays.includes(day)) {
			setSelectedDays(selectedDays.filter((d) => d !== day));
		} else {
			setSelectedDays([...selectedDays, day]);
		}
	};

	// Helper to check if a day is selected by its displayed index
	const isDaySelected = (displayIndex: number) => {
		return selectedDays.includes(displayIndex);
	};

	const renderRepetitionOptions = () => {
		switch (repetitionType) {
			case "daily":
				return (
					<Text
						style={[
							styles.repetitionDescription,
							{ color: colors.textSecondary },
						]}
					>
						Repeat every day
					</Text>
				);
			case "weekly":
				return (
					<View style={styles.daysContainer}>
						{WEEKDAYS.map((day: string, index: number) => (
							<TouchableOpacity
								key={day}
								style={[
									styles.dayButton,
									{
										borderColor: colors.border,
										backgroundColor: colors.input,
									},
									isDaySelected(index) && {
										backgroundColor: colors.primary,
										borderColor: colors.primary,
									},
								]}
								onPress={() => handleDayToggle(index)}
							>
								<Text
									style={[
										styles.dayButtonText,
										{ color: colors.textSecondary },
										isDaySelected(index) && { color: colors.textInverse },
									]}
								>
									{day.substring(0, 3)}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				);
			case "custom":
				return (
					<View style={styles.customDaysContainer}>
						<Text
							style={[
								styles.repetitionDescription,
								{ color: colors.textSecondary },
							]}
						>
							Repeat every
						</Text>
						<TextInput
							style={[
								styles.customDaysInput,
								{
									borderColor: colors.border,
									backgroundColor: colors.input,
									color: colors.text,
								},
							]}
							value={customDays.toString()}
							onChangeText={(text) => {
								const value = Number.parseInt(text);
								if (!Number.isNaN(value) && value > 0) {
									setCustomDays(value);
								}
							}}
							keyboardType="number-pad"
							placeholderTextColor={colors.textTertiary}
						/>
						<Text
							style={[
								styles.repetitionDescription,
								{ color: colors.textSecondary },
							]}
						>
							days
						</Text>
					</View>
				);
			default:
				return null;
		}
	};

	return (
		<View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
			<Text style={[styles.sectionTitle, { color: colors.text }]}>
				Repetition Pattern
			</Text>
			<View style={styles.optionsContainer}>
				<TouchableOpacity
					style={[
						styles.optionButton,
						{
							borderColor: colors.border,
							backgroundColor: colors.input,
						},
						repetitionType === "daily" && {
							backgroundColor: colors.primary,
							borderColor: colors.primary,
						},
					]}
					onPress={() => setRepetitionType("daily")}
				>
					<Text
						style={[
							styles.optionText,
							{ color: colors.textSecondary },
							repetitionType === "daily" && { color: colors.textInverse },
						]}
					>
						Daily
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.optionButton,
						{
							borderColor: colors.border,
							backgroundColor: colors.input,
						},
						repetitionType === "weekly" && {
							backgroundColor: colors.primary,
							borderColor: colors.primary,
						},
					]}
					onPress={() => setRepetitionType("weekly")}
				>
					<Text
						style={[
							styles.optionText,
							{ color: colors.textSecondary },
							repetitionType === "weekly" && {
								color: colors.textInverse,
							},
						]}
					>
						Weekly
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.optionButton,
						{
							borderColor: colors.border,
							backgroundColor: colors.input,
						},
						repetitionType === "custom" && {
							backgroundColor: colors.primary,
							borderColor: colors.primary,
						},
					]}
					onPress={() => setRepetitionType("custom")}
				>
					<Text
						style={[
							styles.optionText,
							{ color: colors.textSecondary },
							repetitionType === "custom" && {
								color: colors.textInverse,
							},
						]}
					>
						Custom
					</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.repetitionOptionsContainer}>
				{renderRepetitionOptions()}
			</View>
		</View>
	);
};

export default RepetitionPatternSection;
