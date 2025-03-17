import { useTheme } from "@/hooks/useTheme";
import { RepetitionType } from "@/types/habit";
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
			case RepetitionType.DAILY:
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
			case RepetitionType.WEEKDAYS:
				return (
					<View style={styles.daysContainer}>
						{WEEKDAYS.map((day: { dayIndex: number; name: string }) => (
							<TouchableOpacity
								key={day.dayIndex}
								style={[
									styles.dayButton,
									{
										borderColor: colors.border,
										backgroundColor: colors.input,
									},
									isDaySelected(day.dayIndex) && {
										backgroundColor: colors.primary,
										borderColor: colors.primary,
									},
								]}
								onPress={() => handleDayToggle(day.dayIndex)}
							>
								<Text
									style={[
										styles.dayButtonText,
										{ color: colors.textSecondary },
										isDaySelected(day.dayIndex) && { color: colors.textInverse },
									]}
								>
									{day.name.substring(0, 3)}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				);
			case RepetitionType.INTERVAL:
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
					onPress={() => setRepetitionType(RepetitionType.DAILY)}
				>
					<Text
						style={[
							styles.optionText,
							{ color: colors.textSecondary },
							repetitionType === RepetitionType.DAILY && { color: colors.textInverse },
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
						repetitionType === RepetitionType.WEEKDAYS && {
							backgroundColor: colors.primary,
							borderColor: colors.primary,
						},
					]}
					onPress={() => setRepetitionType(RepetitionType.WEEKDAYS)}
				>
					<Text
						style={[
							styles.optionText,
							{ color: colors.textSecondary },
							repetitionType === RepetitionType.WEEKDAYS && {
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
						repetitionType === RepetitionType.INTERVAL && {
							backgroundColor: colors.primary,
							borderColor: colors.primary,
						},
					]}
					onPress={() => setRepetitionType(RepetitionType.INTERVAL)}
				>
					<Text
						style={[
							styles.optionText,
							{ color: colors.textSecondary },
							repetitionType === RepetitionType.INTERVAL && {
								color: colors.textInverse,
							},
						]}
					>
						Every X Days
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
