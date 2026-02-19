import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "@/constants/Spacing";

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
});

export default styles;
