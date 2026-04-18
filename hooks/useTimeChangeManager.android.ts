import { useEffect } from "react";
import { getCurrentTimeContext, registerTimeChangeListener } from "@niqp/react-native-android-time-change";

import { handleTimeChangeEvent } from "@/utils/timeChange";

export const useTimeChangeManager = () => {
  useEffect(() => {
    void getCurrentTimeContext().then((context) => handleTimeChangeEvent({ action: "timezone_changed", ...context }));

    return registerTimeChangeListener((event) => {
      void handleTimeChangeEvent(event);
    });
  }, []);
};
