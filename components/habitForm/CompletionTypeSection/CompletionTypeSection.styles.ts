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
	completionOptionsContainer: {
		marginTop: 10,
	},
	completionTypeContainer: {
		marginBottom: 15,
	},
	completionTypeDescription: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	completionDescription: {
		fontSize: 14,
		marginLeft: 10,
	},
	goalContainer: {
		marginLeft: 34,
		marginTop: 8,
	},
	goalLabel: {
		fontSize: 14,
		marginRight: 10,
	},
	goalInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		width: 70,
		textAlign: "center",
		fontSize: 16,
	},
	editNotice: {
		fontSize: 14,
		fontStyle: "italic",
		marginTop: 10,
	},
});
