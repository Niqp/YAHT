import "@expo/metro-runtime";

import { registerTimeChangeHeadlessTask } from "@niqp/react-native-android-time-change";
import { AppRegistry } from "react-native";
import { App } from "expo-router/build/qualified-entry";
import { renderRootComponent } from "expo-router/build/renderRootComponent";

import { handleTimeChangeEvent, TIME_CHANGE_HEADLESS_TASK } from "./utils/timeChange";

registerTimeChangeHeadlessTask(TIME_CHANGE_HEADLESS_TASK);

AppRegistry.registerHeadlessTask(TIME_CHANGE_HEADLESS_TASK, () => handleTimeChangeEvent);

renderRootComponent(App);
