import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIconContainer: {
    width: 32, // Fixed width container
    marginRight: 12, // Consistent spacing
    alignItems: "center", // Center the icon horizontally
  },
  menuItemText: {
    fontSize: 16,
  },
});
