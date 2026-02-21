import { StyleSheet } from "react-native";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";

const ITEM_HEIGHT = 50;

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headingLabel: {
    marginLeft: Spacing.sm,
  },
  label: {
    ...Typography.label,
  },
  timeDisplay: {
    width: "100%",
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  timeDisplayText: {
    ...Typography.title,
    marginBottom: Spacing.xs,
  },
  timeHintText: {
    ...Typography.small,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.base,
    borderWidth: 1,
  },
  pickerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.md,
  },
  pickerColumn: {
    alignItems: "center",
  },
  pickerLabel: {
    ...Typography.small,
    marginBottom: Spacing.sm,
  },
  pickerHighlightContainer: {
    height: 150,
    position: "relative",
    justifyContent: "center",
  },
  pickerHighlight: {
    position: "absolute",
    height: ITEM_HEIGHT,
    left: 0,
    right: 0,
    borderRadius: BorderRadius.sm,
    zIndex: 0, // Behind the text
  },
  pickerScrollView: {
    height: 150,
    width: 80,
  },
  pickerScrollContent: {
    paddingVertical: 50,
  },
  pickerItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    zIndex: 1, // Text above highlight
  },
  pickerItemText: {
    ...Typography.title,
  },
  pickerSeparator: {
    ...Typography.title,
    marginHorizontal: Spacing.sm,
  },
  doneButton: {
    minHeight: 48,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    ...Typography.bodyMedium,
  },
  presetsContainer: {
    marginTop: Spacing.xs,
  },
  presetsLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  presetButtonsScroll: {
    paddingBottom: Spacing.sm,
  },
  presetButton: {
    minHeight: 36,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
    justifyContent: "center",
  },
  presetButtonText: {
    ...Typography.label,
  },
});

export default styles;
