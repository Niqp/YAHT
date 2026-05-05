const { AndroidConfig, withAndroidManifest, withAppBuildGradle, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withIosNativeReminderActions = require("./with-ios-native-reminder-actions");

const ANDROID_SOURCE_DIR = path.join(__dirname, "android-native-reminder-actions");
const ANDROID_RESOURCE_DIR = path.join(ANDROID_SOURCE_DIR, "res");
const ANDROID_PACKAGE = "com.niqp.yaht.notifications";
const ANDROID_TARGET_FILE = "YAHTNativeReminderActionsService.kt";
const ANDROID_MMKV_DEPENDENCY = 'implementation("com.tencent:mmkv:2.0.0")';
const EXPO_NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT";

const withAndroidNativeReminderActionFiles = (config) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const targetRoot = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "java",
        ...ANDROID_PACKAGE.split(".")
      );

      await fs.promises.mkdir(targetRoot, { recursive: true });
      await fs.promises.copyFile(
        path.join(ANDROID_SOURCE_DIR, ANDROID_TARGET_FILE),
        path.join(targetRoot, ANDROID_TARGET_FILE)
      );
      await fs.promises.cp(ANDROID_RESOURCE_DIR, path.join(projectRoot, "android", "app", "src", "main", "res"), {
        recursive: true,
      });

      return config;
    },
  ]);

const withAndroidNativeReminderActionManifest = (config) =>
  withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    app.receiver ??= [];

    const receiverName = ".notifications.YAHTNativeReminderActionsService";
    const existingReceiver = app.receiver.find((receiver) => receiver.$?.["android:name"] === receiverName);
    if (!existingReceiver) {
      app.receiver.push({
        $: {
          "android:name": receiverName,
          "android:enabled": "true",
          "android:exported": "false",
        },
        "intent-filter": [
          {
            $: {
              "android:priority": "1",
            },
            action: [
              {
                $: {
                  "android:name": EXPO_NOTIFICATION_EVENT_ACTION,
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

const withAndroidNativeReminderActionGradle = (config) =>
  withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        `YAHT Android native reminder actions require a Groovy app build.gradle, found ${config.modResults.language}.`
      );
    }

    if (config.modResults.contents.includes("com.tencent:mmkv")) {
      return config;
    }

    const dependencyAnchor = 'implementation("com.facebook.react:react-android")';
    if (!config.modResults.contents.includes(dependencyAnchor)) {
      throw new Error("Cannot install YAHT Android native reminder actions because the React dependency was not found.");
    }

    config.modResults.contents = config.modResults.contents.replace(
      dependencyAnchor,
      [dependencyAnchor, `    ${ANDROID_MMKV_DEPENDENCY}`].join("\n")
    );
    return config;
  });

const withNativeReminderActions = (config) => {
  config = withIosNativeReminderActions(config);
  config = withAndroidNativeReminderActionFiles(config);
  config = withAndroidNativeReminderActionManifest(config);
  config = withAndroidNativeReminderActionGradle(config);
  return config;
};

module.exports = withNativeReminderActions;
