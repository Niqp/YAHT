import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "@/constants/Spacing";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 70,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    height: "100%",
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
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xxs,
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
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default styles;
