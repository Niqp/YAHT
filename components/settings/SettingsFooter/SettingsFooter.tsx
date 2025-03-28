import type React from "react";
import { Text, View } from "react-native";
import { styles } from "./SettingsFooter.styles";
import { useTheme } from "@/hooks/useTheme";

export function SettingsFooter() {
	const { colors } = useTheme();
	return (
		<View style={styles.footer}>
			<Text style={[styles.footerText, { color: colors.textTertiary }]}>
				Yet Another Habit Tracker
			</Text>
			<Text style={[styles.footerText, { color: colors.textTertiary }]}>
				Version {require("../../../package.json").version}
			</Text>
		</View>
	);
}
