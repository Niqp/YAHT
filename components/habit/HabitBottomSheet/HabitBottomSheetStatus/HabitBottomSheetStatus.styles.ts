import { StyleSheet } from "react-native";

export default StyleSheet.create({
	statusSection: {
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
	},
	statusText: {
		fontSize: 16,
		fontWeight: "500",
		textAlign: "center",
		marginBottom: 16,
	},
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 8,
	},
	statItem: {
		alignItems: "center",
	},
	statValue: {
		fontSize: 18,
		fontWeight: "700",
	},
	statLabel: {
		fontSize: 12,
		marginTop: 4,
	},
});
