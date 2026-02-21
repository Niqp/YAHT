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
    minHeight: 100,
    justifyContent: "center",
  },
  completionTypeContainer: {
    marginBottom: Spacing.sm,
  },
  completionTypeDescription: {
    flexDirection: "row",
    alignItems: "center",
  },
  completionDescription: {
    ...Typography.body,
    marginLeft: Spacing.md,
  },
  goalContainer: {
    marginLeft: 40, // 24 (icon) + 16 (spacing.md)
    marginTop: Spacing.md,
  },
  editNoticeContainer: {
    padding: Spacing.base,
    paddingTop: 0,
  },
  editNotice: {
    ...Typography.label,
    fontStyle: "italic",
    textAlign: "center",
  },
});
