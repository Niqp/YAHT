import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  habitIcon: {
    fontSize: 30,
  },
  habitInfoContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  habitSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default styles;
