import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    width: 40,
    height: 4,
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
});

export default styles;
