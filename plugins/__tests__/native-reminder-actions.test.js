const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..", "..");

const readProjectFile = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("native reminder actions plugin", () => {
  it("wires the combined native reminder actions plugin from app.json", () => {
    const appConfig = JSON.parse(readProjectFile("app.json"));

    expect(appConfig.expo.plugins).toContain("./plugins/with-native-reminder-actions");
    expect(appConfig.expo.plugins).not.toContain("./plugins/with-ios-native-reminder-actions");
  });

  it("registers a higher-priority Android notification event receiver", () => {
    const pluginSource = readProjectFile("plugins/with-native-reminder-actions.js");

    expect(pluginSource).toContain(
      'const EXPO_NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT";'
    );
    expect(pluginSource).toContain('const receiverName = ".notifications.YAHTNativeReminderActionsService";');
    expect(pluginSource).toContain('"android:priority": "1"');
  });

  it("adds the Android MMKV dependency and native service source", () => {
    const pluginSource = readProjectFile("plugins/with-native-reminder-actions.js");
    const serviceSource = readProjectFile(
      "plugins/android-native-reminder-actions/YAHTNativeReminderActionsService.kt"
    );

    expect(pluginSource).toContain('implementation("com.tencent:mmkv:2.0.0")');
    expect(pluginSource).toContain("YAHTNativeReminderActionsService.kt");
    expect(pluginSource).toContain("ANDROID_RESOURCE_DIR");
    expect(serviceSource).toContain("class YAHTNativeReminderActionsService : NotificationsService()");
    expect(serviceSource).toContain('private const val HABIT_STORAGE_ID = "yaht-persistence"');
    expect(serviceSource).toContain('private const val RUNTIME_STORAGE_ID = "yaht-runtime"');
    expect(serviceSource).toContain('private const val HABIT_STORAGE_KEY = "habits-storage"');
  });

  it("provides Android native notification copy resources", () => {
    const englishStrings = readProjectFile("plugins/android-native-reminder-actions/res/values/strings.xml");
    const russianStrings = readProjectFile("plugins/android-native-reminder-actions/res/values-ru/strings.xml");

    expect(englishStrings).toContain("yaht_notification_reminder_title");
    expect(russianStrings).toContain("yaht_notification_reminder_title");
  });
});
