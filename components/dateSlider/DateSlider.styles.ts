import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "@/constants/Spacing";

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    width: "100%",
  },
  headerContainer: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  todayButtonContainer: {
    height: 28,
    overflow: "hidden",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xxs,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  streakEmoji: {
    fontSize: 14,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    width: 76,
    height: 28,
    borderRadius: BorderRadius.full,
  },
  todayButtonIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    paddingRight: Spacing.sm,
  },
  flatListContent: {
    paddingHorizontal: Spacing.base,
  },
  recyclerContainer: {
    width: "100%",
    height: 70,
    overflow: "hidden",
  },
  recyclerList: {
    width: "100%",
    height: 70,
  },
  dateItem: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    width: 45,
    height: 70,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayName: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default styles;
