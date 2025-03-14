import Icon from "@expo/vector-icons/FontAwesome6";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import ThemeToggle from "@/components/ThemeToggle";
import { AppMenuList } from "@/components/settings/AppMenuList";
import { SettingsFooter } from "@/components/settings/SettingsFooter";
import { WeekSettings } from "@/components/settings/WeekSettings";

import { useTheme } from "@/hooks/useTheme";
import { exportData, importData } from "@/utils/fileOperations";

export default function SettingsScreen() {
	const { colors, weekStartDay, setWeekStartDay } = useTheme();

	const handleExport = async () => {
		try {
			await exportData();
		} catch (error) {
			console.error("Error exporting data:", error);
			Alert.alert("Export Failed", "Failed to export data. Please try again.");
		}
	};

	const handleImport = async () => {
		try {
			await importData();
		} catch (error) {
			console.error("Error importing data:", error);
			// Alert is already shown in importData function
		}
	};

	const menuItems = [
		{
			title: "About",
			icon: <Icon name="circle-info" size={25} color={colors.primary} />,
			onPress: () => {},
		},
		{
			title: "Source Code",
			icon: <Icon name="github" size={25} color={colors.primary} />,
			onPress: () => {},
		},
		{
			title: "Rate App",
			icon: <Icon name="star" size={24} color={colors.primary} />,
			onPress: () => {},
		},
		{
			title: "Export Data",
			icon: <Icon name="download" size={24} color={colors.primary} />,
			onPress: handleExport,
		},
		{
			title: "Import Data",
			icon: <Icon name="upload" size={24} color={colors.primary} />,
			onPress: handleImport,
		},
	];

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView style={styles.scrollContainer}>
				<Text style={[styles.headerText, { color: colors.text }]}>
					Settings
				</Text>

				<ThemeToggle />

				<WeekSettings
					weekStartDay={weekStartDay}
					setWeekStartDay={setWeekStartDay}
				/>

				<AppMenuList menuItems={menuItems} />

				<SettingsFooter />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContainer: {
		flex: 1,
		padding: 16,
	},
	headerText: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		marginTop: 10,
	},
});
