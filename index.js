import "@expo/metro-runtime";

import { registerReminderNotificationTask } from "./utils/registerReminderNotificationTask";
import { registerTimeChangeTask } from "./utils/registerTimeChangeTask";

registerReminderNotificationTask();
registerTimeChangeTask();

// Keep task registration ahead of the router root while using Expo Router's public entrypoint.
require("expo-router/entry");
