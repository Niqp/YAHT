const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..", "..");

const readProjectFile = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("iOS native reminder actions plugin", () => {
  it("adds source files to the Xcode project with the generated app group prefix", () => {
    const pluginSource = readProjectFile("plugins/with-ios-native-reminder-actions.js");

    expect(pluginSource).toContain(
      "const nativeSourceFilePath = (fileName) => `${projectGroupName}/${TARGET_DIR}/${fileName}`;"
    );
    expect(pluginSource).toContain('filepath: nativeSourceFilePath("YAHTNativeReminderActions.swift")');
    expect(pluginSource).toContain('filepath: nativeSourceFilePath("YAHTNativeReminderStorage.mm")');
    expect(pluginSource).not.toContain("filepath: `${TARGET_DIR}/YAHTNativeReminderActions.swift`");
    expect(pluginSource).not.toContain("filepath: `${TARGET_DIR}/YAHTNativeReminderStorage.mm`");
  });

  it("imports react-native-mmkv with the same POSIX mode used by the pod", () => {
    const storageSource = readProjectFile("plugins/ios-native-reminder-actions/YAHTNativeReminderStorage.mm");
    const forcePosixIndex = storageSource.indexOf("#define FORCE_POSIX");
    const mmkvImportIndex = storageSource.indexOf('#import "MMKV.h"');

    expect(forcePosixIndex).toBeGreaterThanOrEqual(0);
    expect(mmkvImportIndex).toBeGreaterThan(forcePosixIndex);
    expect(storageSource).not.toContain("#import <MMKV/MMKV.h>");
  });

  it("keeps native iOS quick actions at targeted-background parity with Android and JS", () => {
    const swiftSource = readProjectFile("plugins/ios-native-reminder-actions/YAHTNativeReminderActions.swift");

    expect(swiftSource).toContain('static let habitStorageId = "yaht-persistence"');
    expect(swiftSource).toContain('static let runtimeStorageId = "yaht-runtime"');
    expect(swiftSource).toContain("releaseResponseClaim(responseKey)");
    expect(swiftSource).toContain("scheduleNextIntervalSeriesIfNeeded(habitSnapshot: habitSnapshot");
    expect(swiftSource).toContain("buildReminderSeriesJobs(");
    expect(swiftSource).toContain("scheduleReminderSeries(payload.reminderSeriesId, jobs: jobs)");
    expect(swiftSource).toContain("replaceScheduleLedgerEntries(for: reminderSeriesId, jobs: jobs)");
    expect(swiftSource).toContain('static let diagnosticEventsKey = "diagnostic-events"');
    expect(swiftSource).toContain("static let diagnosticRetentionMs");
    expect(swiftSource).toContain("static let diagnosticMaxSerializedBytes");
    expect(swiftSource).toContain("appendDiagnosticEvent(");
    expect(swiftSource).toContain('"responseKey": responseKey');
    expect(swiftSource).toContain('"didMutate": true');
    expect(swiftSource).toContain('"dismissedCount": dismissedCount');
    expect(swiftSource).toContain("content.title = job.habitTitle");
    expect(swiftSource).toContain('localizedString("notification_follow_up_body")');
  });

  it("does not persist habit titles in iOS diagnostic event records", () => {
    const swiftSource = readProjectFile("plugins/ios-native-reminder-actions/YAHTNativeReminderActions.swift");
    const appendDiagnosticStart = swiftSource.indexOf("private func appendDiagnosticEvent(");
    const responseLedgerStart = swiftSource.indexOf("private func claimResponse(");
    const appendDiagnosticSource = swiftSource.slice(appendDiagnosticStart, responseLedgerStart);

    expect(appendDiagnosticStart).toBeGreaterThanOrEqual(0);
    expect(appendDiagnosticSource).not.toContain("habitTitle");
  });

  it("waits for async iOS cancellation before scheduling replacement reminder series", () => {
    const swiftSource = readProjectFile("plugins/ios-native-reminder-actions/YAHTNativeReminderActions.swift");

    expect(swiftSource).toContain("cancelReminderSeries(payload.reminderSeriesId, payload: payload) {");
    expect(swiftSource).toContain(
      "private func cancelReminderSeries(_ reminderSeriesId: String, payload: ReminderPayload"
    );
    expect(swiftSource).toContain("group.notify(queue: .main) {");
    expect(swiftSource).not.toContain("let scheduledJobs = jobs");
  });

  it("ships iOS native reminder and follow-up localization resources", () => {
    const englishStrings = readProjectFile(
      "plugins/ios-native-reminder-actions/en.lproj/YAHTNativeReminderActions.strings"
    );
    const russianStrings = readProjectFile(
      "plugins/ios-native-reminder-actions/ru.lproj/YAHTNativeReminderActions.strings"
    );

    expect(englishStrings).toContain('"notification_reminder_title" = "Reminder";');
    expect(englishStrings).toContain('"notification_follow_up_title" = "Still due";');
    expect(englishStrings).toContain(
      '"notification_follow_up_body" = "Still due. Mark it done when you\'re finished.";'
    );
    expect(russianStrings).toContain('"notification_reminder_title" = "Напоминание";');
    expect(russianStrings).toContain('"notification_follow_up_title" = "Все еще актуально";');
    expect(russianStrings).toContain(
      '"notification_follow_up_body" = "Все еще актуально. Отметьте выполнение, когда закончите.";'
    );
  });
});
