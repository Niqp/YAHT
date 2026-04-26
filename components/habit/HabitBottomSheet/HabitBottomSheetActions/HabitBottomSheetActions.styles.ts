import { StyleSheet } from "react-native";
import { BorderRadius, Spacing } from "@/constants/Spacing";

const styles = StyleSheet.create({
  container: {
    gap: Spacing.base,
  },
  repetitionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  repButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  repText: {
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  primaryActionButton: {
    flex: 1,
  },
  secondaryActionsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  actionText: {
    marginLeft: Spacing.xs,
    textAlign: "center",
    flexShrink: 1,
  },
});

export default styles;
