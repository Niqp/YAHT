import * as DocumentPicker from "expo-document-picker";
// Note: You'll need to install these packages:
// expo install expo-file-system expo-document-picker expo-sharing
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { useHabitStore } from "../store/habitStore";
import { getCurrentDateStamp } from "./date";

/**
 * Exports all habit data to a JSON file and offers to share it
 * Requires: expo-file-system, expo-sharing
 */
export const exportData = async (): Promise<void> => {
  try {
    // Get all habits from the store
    const { habits } = useHabitStore.getState();

    // Convert habits to JSON string with proper formatting
    const habitsJson = JSON.stringify(habits, null, 2);

    // Create file name with current date
    const date = getCurrentDateStamp();
    const fileName = `habits_backup_${date}.json`;

    // Create file path in app's documents directory
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Write data to file
    await FileSystem.writeAsStringAsync(filePath, habitsJson);

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: "Export Habits Data",
        UTI: "public.json", // For iOS
      });

      Alert.alert("Export Successful", "Your habits data has been exported successfully.");
    } else {
      Alert.alert("Sharing not available", `Sharing is not available on this device, but the file was saved to ${filePath}`);
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    Alert.alert("Export Failed", "Failed to export data. Please try again.");
  }
};

/**
 * Imports habit data from a JSON file and updates the app state
 * Requires: expo-file-system, expo-document-picker
 */
export const importData = async (): Promise<void> => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    // Check if document was picked
    if (result.canceled) {
      return;
    }

    // Read file content
    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);

    // Parse JSON
    try {
      const importedHabits = JSON.parse(fileContent);

      // Validate habits
      if (typeof importedHabits !== "object" || importedHabits === null) {
        throw new Error("Invalid habits data: not an object");
      }

      // Confirm import with the user
      Alert.alert("Import Data", `Found ${Object.keys(importedHabits).length} habits in the file. This will replace your current data. Continue?`, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Import",
          onPress: async () => {
            // Use the importHabits function from the store
            const importHabits = useHabitStore((state) => state.importHabits);

            try {
              const importedCount = await importHabits(importedHabits);
              Alert.alert("Import Complete", `Successfully imported ${importedCount} habits.`);
            } catch (error) {
              if (error instanceof Error) {
                console.error("Error importing habits:", error.message);
              }
              Alert.alert("Import Failed", "Failed to import data. Please try again.");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      Alert.alert("Import Failed", "The selected file contains invalid data.");
    }
  } catch (error) {
    console.error("Error importing data:", error);
    Alert.alert("Import Failed", "Failed to import data. Please try again.");
  }
};
