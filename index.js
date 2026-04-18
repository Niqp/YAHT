import "@expo/metro-runtime";

import { App } from "expo-router/build/qualified-entry";
import { renderRootComponent } from "expo-router/build/renderRootComponent";

import { registerTimeChangeTask } from "./utils/registerTimeChangeTask";

registerTimeChangeTask();

renderRootComponent(App);
