import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerContainer: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
  flatListContent: {
    paddingHorizontal: 10,
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
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default styles;
