import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
  },
  weekSettingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  weekSettingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  weekSettingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  weekDayOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weekDayButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  weekDayButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
