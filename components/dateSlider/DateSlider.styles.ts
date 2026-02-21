import { StyleSheet } from "react-native";
import { Spacing, BorderRadius } from "@/constants/Spacing";

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
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
    gap: Spacing.sm,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
  flatListContent: {
    paddingHorizontal: Spacing.sm,
  },
  dateItem: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    width: 45,
    height: 70,
    borderRadius: 22.5,
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
