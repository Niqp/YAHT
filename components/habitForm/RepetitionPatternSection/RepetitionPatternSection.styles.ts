import { StyleSheet } from "react-native";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";

export const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 13,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  surface: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  segmentedControlContainer: {
    flexDirection: "row",
    height: 44,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  segmentText: {
    ...Typography.bodyMedium,
  },
  optionsWrapper: {
    borderTopWidth: 1,
    padding: Spacing.base,
    minHeight: 80,
    justifyContent: "center",
  },
  infoRow: {
    alignItems: "center",
  },
  infoText: {
    ...Typography.body,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipText: {
    ...Typography.bodyMedium,
  },
  customDaysContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  customDaysInputContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.md,
    width: 60,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  customDaysInput: {
    ...Typography.title,
    textAlign: "center",
    width: "100%",
    height: "100%",
  },
});
