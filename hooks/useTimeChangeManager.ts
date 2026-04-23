import { useEffect } from "react";
import { Platform } from "react-native";
import { getCurrentTimeContext, registerTimeChangeListener } from "@niqp/react-native-android-time-change";

import { handleTimeChangeEvent } from "@/utils/timeChange";

export const useTimeChangeManager = (): void => {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void getCurrentTimeContext().then((context) => handleTimeChangeEvent({ action: "timezone_changed", ...context }));

    return registerTimeChangeListener((event) => {
      void handleTimeChangeEvent(event);
    });
  }, []);
};
