import { useEffect } from "react";
import { getCurrentTimeContext, registerTimeChangeListener } from "@niqp/react-native-android-time-change";

import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { handleTimeChangeEvent } from "@/utils/timeChange";

export const useTimeChangeManager = () => {
  useEffect(() => {
    void getCurrentTimeContext()
      .then((context) => {
        logEvent("timeChange.currentContextHandled", {
          action: "timezone_changed",
          timeZone: context.timeZone,
          utcOffsetMinutes: context.utcOffsetMinutes,
        });
        return handleTimeChangeEvent({ action: "timezone_changed", ...context });
      })
      .catch((error) => logError("timeChange.currentContextFailed", { operation: "getCurrentTimeContext", error }));

    return registerTimeChangeListener((event) => {
      logEvent("timeChange.foregroundReceived", {
        action: event.action,
        timeZone: event.timeZone,
        utcOffsetMinutes: event.utcOffsetMinutes,
      });
      void handleTimeChangeEvent(event);
    });
  }, []);
};
