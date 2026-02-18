import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "transparent",
    height: 70,
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
    paddingLeft: 14,
    paddingRight: 0,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconText: {
    fontSize: 22,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 13,
    marginLeft: 4,
  },
  actionButtons: {
    width: 88,
    height: 22,
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  statusContainer: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  repControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: 88,
  },
  repButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  repCount: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 6,
    width: 16,
    textAlign: "center",
  },
  moreButton: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
});

export default styles;
