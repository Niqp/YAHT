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

    expect(swiftSource).toContain("releaseResponseClaim(responseKey)");
    expect(swiftSource).toContain("scheduleNextIntervalSeriesIfNeeded(habitSnapshot: habitSnapshot");
    expect(swiftSource).toContain("buildReminderSeriesJobs(");
    expect(swiftSource).toContain("scheduleReminderSeries(payload.reminderSeriesId, jobs: jobs)");
    expect(swiftSource).toContain("replaceScheduleLedgerEntries(for: reminderSeriesId, jobs: jobs)");
    expect(swiftSource).toContain('localizedString("notification_follow_up_title")');
    expect(swiftSource).toContain('localizedString("notification_follow_up_body")');
  });

  it("waits for async iOS cancellation before scheduling replacement reminder series", () => {
    const swiftSource = readProjectFile("plugins/ios-native-reminder-actions/YAHTNativeReminderActions.swift");

    expect(swiftSource).toContain("cancelReminderSeries(payload.reminderSeriesId) {");
    expect(swiftSource).toContain(
      "private func cancelReminderSeries(_ reminderSeriesId: String, completion: @escaping () -> Void)"
    );
    expect(swiftSource).toContain("group.notify(queue: .main, execute: completion)");
    expect(swiftSource).not.toContain("let scheduledJobs = jobs");
  });

  it("ships iOS native reminder and follow-up localization resources", () => {
    const englishStrings = readProjectFile(
      "plugins/ios-native-reminder-actions/en.lproj/YAHTNativeReminderActions.strings"
    );
    const russianStrings = readProjectFile(
      "plugins/ios-native-reminder-actions/ru.lproj/YAHTNativeReminderActions.strings"
    );

    expect(englishStrings).toContain('"notification_reminder_title" = "Friendly Reminder";');
    expect(englishStrings).toContain('"notification_follow_up_title" = "Still waiting";');
    expect(englishStrings).toContain('"notification_follow_up_body" = "%@ still needs attention.";');
    expect(russianStrings).toContain('"notification_reminder_title" = "Напоминание";');
    expect(russianStrings).toContain('"notification_follow_up_title" = "Все еще ждет";');
    expect(russianStrings).toContain('"notification_follow_up_body" = "«%@» все еще требует внимания.";');
  });
});
