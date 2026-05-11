// Note: This utility depends on expo-file-system and expo-sharing.
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { useHabitStore } from "../store/habitStore";
import { getCurrentDateStamp } from "./date";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { translate } from "@/i18n";

/**
 * Exports all habit data to a JSON file and offers to share it
 * Requires: expo-file-system, expo-sharing
 */
export const exportData = async (): Promise<void> => {
  try {
    // Get all habits from the store
    const { habits } = useHabitStore.getState();
    logEvent("data.export.started", { habitCount: Object.keys(habits).length });

    // Convert habits to JSON string with proper formatting
    const habitsJson = JSON.stringify(habits, null, 2);

    // Create file name with current date
    const date = getCurrentDateStamp();
    const fileName = `habits_backup_${date}.json`;

    // Create the backup file in the app's documents directory
    const backupFile = new File(Paths.document, fileName);

    backupFile.create({ overwrite: true });
    backupFile.write(habitsJson);

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupFile.uri, {
        mimeType: "application/json",
        dialogTitle: translate("fileOperations.exportTitle"),
        UTI: "public.json", // For iOS
      });

      Alert.alert(translate("fileOperations.exportSuccessTitle"), translate("fileOperations.exportSuccessBody"));
    } else {
      Alert.alert(
        translate("fileOperations.sharingUnavailableTitle"),
        translate("fileOperations.sharingUnavailableSavedBody", { uri: backupFile.uri })
      );
    }
    logEvent("data.export.completed", { habitCount: Object.keys(habits).length });
  } catch (error) {
    console.error("Error exporting data:", error);
    logError("data.export.failed", { operation: "exportData", error });
    Alert.alert(translate("fileOperations.exportFailedTitle"), translate("fileOperations.exportFailedBody"));
  }
};

/**
 * Imports habit data from a JSON file and updates the app state
 * Requires: expo-file-system
 */
export const importData = async (): Promise<void> => {
  try {
    const pickedFile = await File.pickFileAsync(undefined, "application/json");
    const file = Array.isArray(pickedFile) ? pickedFile[0] : pickedFile;
    const fileContent = await file.text();
    const importHabits = useHabitStore.getState().importHabits;

    // Parse JSON
    try {
      const importedHabits = JSON.parse(fileContent);

      // Validate habits
      if (typeof importedHabits !== "object" || importedHabits === null) {
        throw new Error("Invalid habits data: not an object");
      }
      const importedCount = Object.keys(importedHabits).length;
      logEvent("data.import.parsed", { count: importedCount });

      // Confirm import with the user
      Alert.alert(
        translate("fileOperations.importConfirmTitle"),
        translate("fileOperations.importFoundBody", { count: importedCount }),
        [
          {
            text: translate("common.cancel"),
            style: "cancel",
          },
          {
            text: translate("fileOperations.importAction"),
            onPress: async () => {
              try {
                const importedCount = await importHabits(importedHabits);
                logEvent("data.import.completed", { count: importedCount });
                Alert.alert(
                  translate("fileOperations.importCompleteTitle"),
                  translate("fileOperations.importCompleteBody", { count: importedCount })
                );
              } catch (error) {
                if (error instanceof Error) {
                  console.error("Error importing habits:", error.message);
                }
                logError("data.import.failed", { operation: "importHabits", error });
                Alert.alert(
                  translate("fileOperations.importFailedTitle"),
                  translate("fileOperations.importFailedBody")
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error parsing JSON:", error);
      logError("data.import.parseFailed", { operation: "importData", error });
      Alert.alert(translate("fileOperations.importFailedTitle"), translate("fileOperations.importInvalidBody"));
    }
  } catch (error) {
    console.error("Error importing data:", error);
    logError("data.import.failed", { operation: "importData", error });
    Alert.alert(translate("fileOperations.importFailedTitle"), translate("fileOperations.importFailedBody"));
  }
};
