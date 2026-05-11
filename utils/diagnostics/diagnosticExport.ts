import Constants from "expo-constants";
import { Directory } from "expo-file-system";
import { Platform } from "react-native";

import { getDiagnosticEvents, type DiagnosticEvent } from "@/utils/diagnostics/diagnosticLogger";
import { sanitizeDiagnosticContext } from "@/utils/diagnostics/diagnosticRedaction";
import { useThemeStore } from "@/store/themeStore";

export type DiagnosticReport = {
  schemaVersion: 1;
  exportedAt: string;
  app: {
    version: string;
    platform: string;
    locale?: string;
    timeZone?: string;
    themeMode: string;
  };
  storage: {
    eventCount: number;
    jsEventCount: number;
    androidNativeEventCount: number;
    iosNativeEventCount: number;
  };
  events: DiagnosticEvent[];
  jsEvents: DiagnosticEvent[];
  androidNativeNotificationActionEvents: DiagnosticEvent[];
  iosNativeReminderActionEvents: DiagnosticEvent[];
};

type ReportOptions = {
  nowMs?: number;
};

const padDatePart = (value: number) => value.toString().padStart(2, "0");

const formatFileDate = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}-${padDatePart(
    date.getHours()
  )}${padDatePart(date.getMinutes())}${padDatePart(date.getSeconds())}`;

const getTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

const getLocale = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
};

const getThemeMode = () => {
  try {
    return useThemeStore.getState().mode;
  } catch {
    return "unknown";
  }
};

const sanitizeEventForReport = (event: DiagnosticEvent): DiagnosticEvent => ({
  ...event,
  context: sanitizeDiagnosticContext(event.context),
});

export const getDiagnosticReport = ({ nowMs = Date.now() }: ReportOptions = {}): DiagnosticReport => {
  const events = getDiagnosticEvents({ nowMs }).map(sanitizeEventForReport);
  const jsEvents = events.filter((event) => event.source === "js");
  const androidNativeNotificationActionEvents = events.filter((event) => event.source === "android-native");
  const iosNativeReminderActionEvents = events.filter((event) => event.source === "ios-native");

  return {
    schemaVersion: 1,
    exportedAt: new Date(nowMs).toISOString(),
    app: {
      version: Constants.expoConfig?.version ?? "unknown",
      platform: Platform.OS,
      locale: getLocale(),
      timeZone: getTimeZone(),
      themeMode: getThemeMode(),
    },
    storage: {
      eventCount: events.length,
      jsEventCount: jsEvents.length,
      androidNativeEventCount: androidNativeNotificationActionEvents.length,
      iosNativeEventCount: iosNativeReminderActionEvents.length,
    },
    events,
    jsEvents,
    androidNativeNotificationActionEvents,
    iosNativeReminderActionEvents,
  };
};

export const exportDiagnosticReport = async ({ nowMs = Date.now() }: ReportOptions = {}) => {
  if (Platform.OS === "web") {
    throw new Error("Diagnostic export is not supported on web.");
  }

  const directory = await Directory.pickDirectoryAsync();
  const fileName = `yaht-diagnostics-${formatFileDate(new Date(nowMs))}.json`;
  const file = directory.createFile(fileName, "application/json");
  file.write(JSON.stringify(getDiagnosticReport({ nowMs }), null, 2));

  return {
    fileName,
    uri: file.uri,
  };
};
