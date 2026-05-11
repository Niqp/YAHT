import { registerTimeChangeHeadlessTask } from "@niqp/react-native-android-time-change";
import { AppRegistry } from "react-native";

import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { handleTimeChangeEvent, TIME_CHANGE_HEADLESS_TASK } from "@/utils/timeChange";

export const registerTimeChangeTask = (): void => {
  try {
    registerTimeChangeHeadlessTask(TIME_CHANGE_HEADLESS_TASK);
    AppRegistry.registerHeadlessTask(TIME_CHANGE_HEADLESS_TASK, () => handleTimeChangeEvent);
    logEvent("timeChange.headlessRegistered", { operation: "registerTimeChangeTask" });
  } catch (error) {
    logError("timeChange.headlessRegisterFailed", { operation: "registerTimeChangeTask", error });
  }
};
