import "@expo/metro-runtime";

import { App } from "expo-router/build/qualified-entry";
import { renderRootComponent } from "expo-router/build/renderRootComponent";

import { registerReminderNotificationTask } from "./utils/registerReminderNotificationTask";
import { registerTimeChangeTask } from "./utils/registerTimeChangeTask";

registerReminderNotificationTask();
registerTimeChangeTask();

renderRootComponent(App);
