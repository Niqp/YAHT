import { StyleSheet } from "react-native";
import { Spacing } from "@/constants/Spacing";

export default StyleSheet.create({
  statusSection: {
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    marginBottom: Spacing.base,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    marginTop: Spacing.xs,
  },
});
