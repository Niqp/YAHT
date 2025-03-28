import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	section: {
		borderRadius: 12,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
	},
	optionsContainer: {
		flexDirection: "row",
		marginBottom: 15,
	},
	optionButton: {
		flex: 1,
		padding: 10,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		marginHorizontal: 4,
		borderRadius: 8,
	},
	optionText: {
		fontSize: 14,
	},
	repetitionOptionsContainer: {
		marginTop: 10,
	},
	repetitionDescription: {
		fontSize: 14,
	},
	daysContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	dayButton: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		marginVertical: 5,
		width: "30%",
		alignItems: "center",
	},
	dayButtonText: {
		fontSize: 14,
	},
	customDaysContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	customDaysInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		marginHorizontal: 10,
		width: 60,
		textAlign: "center",
		fontSize: 16,
	},
});
