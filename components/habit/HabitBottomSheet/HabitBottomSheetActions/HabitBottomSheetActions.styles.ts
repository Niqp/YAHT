import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    flexBasis: "31%", // Slightly increased from 30% to provide more space
    padding: 15, // Slightly reduced padding to fit more text
    borderRadius: 16,
    marginBottom: 12,
  },
  actionText: {
    marginTop: 8,
    fontSize: 13, // Slightly smaller to fit better
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 1,
  },
});

export default styles;
