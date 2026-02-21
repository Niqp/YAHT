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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  emojiInput: {
    ...Typography.title,
    textAlign: "center",
    width: "100%",
    height: "100%",
  },
  titleInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 18,
    minHeight: 48,
  },
});
