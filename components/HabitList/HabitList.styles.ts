import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "@/constants/Spacing";

const styles = StyleSheet.create({
  listWrapper: {
    flex: 1,
  },
  habitList: {
    paddingHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    gap: Spacing.lg,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTextBlock: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  addHabitButton: {
    alignSelf: "stretch",
    marginTop: Spacing.sm,
  },
});

export default styles;
