import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
	actionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		flexWrap: "wrap",
	},
	actionButton: {
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
		borderRadius: 16,
		width: "30%",
		...Platform.select({
			ios: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
			},
			android: {
				elevation: 2,
			},
		}),
		marginBottom: 12,
	},
	actionText: {
		marginTop: 8,
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
	},
});

export default styles;
