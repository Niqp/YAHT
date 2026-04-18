import { registerTimeChangeHeadlessTask } from "@niqp/react-native-android-time-change";
import { AppRegistry } from "react-native";

import { handleTimeChangeEvent, TIME_CHANGE_HEADLESS_TASK } from "@/utils/timeChange";

export const registerTimeChangeTask = (): void => {
  registerTimeChangeHeadlessTask(TIME_CHANGE_HEADLESS_TASK);
  AppRegistry.registerHeadlessTask(TIME_CHANGE_HEADLESS_TASK, () => handleTimeChangeEvent);
};
