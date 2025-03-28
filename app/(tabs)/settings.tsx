import Icon from "@expo/vector-icons/FontAwesome6";
import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import ThemeToggle from "@/components/ThemeToggle";
import { AppMenuList } from "@/components/settings/AppMenuList";
import { SettingsFooter } from "@/components/settings/SettingsFooter";
import { WeekSettings } from "@/components/settings/WeekSettings";

import { useTheme } from "@/hooks/useTheme";
import { exportData, importData } from "@/utils/fileOperations";
import { useHabitStore } from "@/store/habitStore";

export default function SettingsScreen() {
  const { colors, weekStartDay, setWeekStartDay } = useTheme();
  // Fix: Use a simple selector instead of an inline object selector
  const resetStore = useHabitStore((state) => state.resetStore);

  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert("Export Failed", "Failed to export data. Please try again.");
    }
  };

  const handleImport = async () => {
    try {
      await importData();
    } catch (error) {
      console.error("Error importing data:", error);
      // Alert is already shown in importData function
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Data",
      "This will delete all your data. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            useHabitStore.persist.clearStorage(); // Clear local storage
            resetStore();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const menuItems = [
    {
      title: "Source Code",
      icon: <Icon name="github" size={25} color={colors.primary} />,
      onPress: () => Linking.openURL("https://github.com/Niqp/YAHT"),
    },
    {
      title: "Export Data",
      icon: <Icon name="download" size={24} color={colors.primary} />,
      onPress: handleExport,
    },
    {
      title: "Import Data",
      icon: <Icon name="upload" size={24} color={colors.primary} />,
      onPress: handleImport,
    },
    {
      title: "Reset Data",
      icon: <Icon name="trash" size={24} color={colors.primary} />,
      onPress: handleReset,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.headerText, { color: colors.text }]}>Settings</Text>

        <ThemeToggle />

        <WeekSettings weekStartDay={weekStartDay} setWeekStartDay={setWeekStartDay} />

        <AppMenuList menuItems={menuItems} />

        <SettingsFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
  },
});
