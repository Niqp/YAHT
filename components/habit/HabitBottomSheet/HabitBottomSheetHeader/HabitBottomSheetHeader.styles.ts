import { StyleSheet } from "react-native";
import { BorderRadius, Spacing } from "@/constants/Spacing";

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: Spacing.base,
    marginBottom: Spacing.base,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    borderWidth: 1,
  },
  habitIcon: {
    fontSize: 22,
    lineHeight: 24,
  },
  habitInfoContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
    gap: Spacing.xs,
  },
  habitTitle: {
    marginTop: Spacing.xs,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default styles;
