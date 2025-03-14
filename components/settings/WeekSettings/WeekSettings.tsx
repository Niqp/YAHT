import { Calendar } from "lucide-react-native";
import type React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { WeekStartDay } from "../../../store/themeStore";
import { styles } from "./WeekSettings.styles";
import { useTheme } from "@/hooks/useTheme";

interface WeekSettingsProps {
	weekStartDay: WeekStartDay;
	setWeekStartDay: (day: WeekStartDay) => void;
}

export const WeekSettings: React.FC<WeekSettingsProps> = ({
	weekStartDay,
	setWeekStartDay,
}) => {
	const { colors } = useTheme();
	return (
		<View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
			<Text style={[styles.sectionTitle, { color: colors.text }]}>
				Week Settings
			</Text>
			<View style={styles.weekSettingContainer}>
				<View style={styles.weekSettingHeader}>
					<Calendar size={22} color={colors.primary} />
					<Text style={[styles.weekSettingLabel, { color: colors.text }]}>
						First day of week
					</Text>
				</View>

				<View style={styles.weekDayOptions}>
					<TouchableOpacity
						style={[
							styles.weekDayButton,
							{ backgroundColor: colors.input },
							weekStartDay === 0 && { backgroundColor: colors.primary },
						]}
						onPress={() => setWeekStartDay(0)}
					>
						<Text
							style={[
								styles.weekDayButtonText,
								{ color: colors.textSecondary },
								weekStartDay === 0 && { color: colors.textInverse },
							]}
						>
							Sunday
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.weekDayButton,
							{ backgroundColor: colors.input },
							weekStartDay === 1 && { backgroundColor: colors.primary },
						]}
						onPress={() => setWeekStartDay(1)}
					>
						<Text
							style={[
								styles.weekDayButtonText,
								{ color: colors.textSecondary },
								weekStartDay === 1 && { color: colors.textInverse },
							]}
						>
							Monday
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};
