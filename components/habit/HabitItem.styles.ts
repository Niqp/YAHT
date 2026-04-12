import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "@/constants/Spacing";

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    minHeight: 70,
  },
  contentWrapper: {
    ...({ overflow: "hidden" } as const),
    borderRadius: BorderRadius.md - 1,
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    position: "relative" as const,
    minHeight: 70,
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: Spacing.md,
    paddingRight: 0,
    // Ensure the touch area is at least 56pt tall (list item row per §5.1)
    minHeight: 56,
  },
  iconContainer: {
    // 44×44 minimum touch target (§5.1)
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 22,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    minHeight: 56,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
  },
  actionButtons: {
    // Enough width for rep controls; height is set by parent row
    minWidth: 88,
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  statusContainer: {
    // 44×44 minimum touch target (§5.1)
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  repControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  repButton: {
    // 44×44 minimum touch target (§5.1) — visual circle is smaller via inner icon
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  repCount: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  moreButton: {
    // 44×44 minimum touch target (§5.1)
    width: 44,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
});

export default styles;
