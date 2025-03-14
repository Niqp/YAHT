import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
	habitList: {
		padding: 0,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 30,
	},
	emptyText: {
		fontSize: 16,
		marginBottom: 20,
	},
	listWrapper: {
		flex: 1,
	},
	addHabitButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	addHabitButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
});
export default styles;
