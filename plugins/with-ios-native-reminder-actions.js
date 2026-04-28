const { IOSConfig, withAppDelegate, withDangerousMod, withXcodeProject } = require("@expo/config-plugins");
const { addBuildSourceFileToGroup, addResourceFileToGroup } = require("@expo/config-plugins/build/ios/utils/Xcodeproj");
const fs = require("fs");
const path = require("path");

const SOURCE_DIR = path.join(__dirname, "ios-native-reminder-actions");
const TARGET_DIR = "YAHTNativeReminderActions";
const SOURCE_FILES = [
  "YAHTNativeReminderActions.swift",
  "YAHTNativeReminderStorage.h",
  "YAHTNativeReminderStorage.mm",
  "YAHTNativeReminderActions-Bridging-Header.h",
];
const LOCALIZATION_DIRS = ["en.lproj", "ru.lproj"];
const LOCALIZATION_FILE = "YAHTNativeReminderActions.strings";

const withIosNativeReminderActionFiles = (config) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosSourceRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
      const targetRoot = path.join(iosSourceRoot, TARGET_DIR);

      await fs.promises.mkdir(targetRoot, { recursive: true });
      await Promise.all(
        SOURCE_FILES.map((fileName) =>
          fs.promises.copyFile(path.join(SOURCE_DIR, fileName), path.join(targetRoot, fileName))
        )
      );
      await Promise.all(
        LOCALIZATION_DIRS.map(async (localeDir) => {
          const targetLocaleDir = path.join(targetRoot, localeDir);
          await fs.promises.mkdir(targetLocaleDir, { recursive: true });
          await fs.promises.copyFile(
            path.join(SOURCE_DIR, localeDir, LOCALIZATION_FILE),
            path.join(targetLocaleDir, LOCALIZATION_FILE)
          );
        })
      );

      return config;
    },
  ]);

const withIosNativeReminderActionProject = (config) =>
  withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosSourceRoot = IOSConfig.Paths.getSourceRoot(projectRoot);
    const projectGroupName = path.basename(iosSourceRoot);
    const groupName = `${projectGroupName}/${TARGET_DIR}`;
    const nativeSourceFilePath = (fileName) => `${projectGroupName}/${TARGET_DIR}/${fileName}`;

    IOSConfig.XcodeUtils.ensureGroupRecursively(project, groupName);
    addBuildSourceFileToGroup({
      filepath: nativeSourceFilePath("YAHTNativeReminderActions.swift"),
      groupName,
      project,
    });
    addBuildSourceFileToGroup({
      filepath: nativeSourceFilePath("YAHTNativeReminderStorage.mm"),
      groupName,
      project,
    });
    LOCALIZATION_DIRS.forEach((localeDir) => {
      addResourceFileToGroup({
        filepath: nativeSourceFilePath(`${localeDir}/${LOCALIZATION_FILE}`),
        groupName,
        isBuildFile: true,
        project,
      });
    });

    const bridgingHeaderPath = `${projectGroupName}/${TARGET_DIR}/YAHTNativeReminderActions-Bridging-Header.h`;
    const configurationEntries = IOSConfig.XcodeUtils.getXCConfigurationListEntries(project);
    for (const [, configurationList] of configurationEntries) {
      for (const buildConfiguration of configurationList.buildConfigurations ?? []) {
        const section = project.pbxXCBuildConfigurationSection()[buildConfiguration.value];
        if (!section?.buildSettings) {
          continue;
        }

        section.buildSettings.SWIFT_OBJC_BRIDGING_HEADER = `"${bridgingHeaderPath}"`;
      }
    }

    return config;
  });

const withIosNativeReminderActionAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error(
        `YAHT iOS native reminder actions require a Swift AppDelegate, found ${config.modResults.language}.`
      );
    }

    const installCall = "YAHTNativeReminderActions.install()";
    if (config.modResults.contents.includes(installCall)) {
      return config;
    }

    const superCall = "super.application(application, didFinishLaunchingWithOptions: launchOptions)";
    const returnPattern = new RegExp(`return ${superCall.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    if (!returnPattern.test(config.modResults.contents)) {
      throw new Error(
        "Cannot install YAHT iOS native reminder actions because AppDelegate launch return was not found."
      );
    }

    config.modResults.contents = config.modResults.contents.replace(
      returnPattern,
      [
        `let yahtApplicationDidFinishLaunching = ${superCall}`,
        installCall,
        "return yahtApplicationDidFinishLaunching",
      ].join("\n    ")
    );
    return config;
  });

const withIosNativeReminderActions = (config) => {
  config = withIosNativeReminderActionFiles(config);
  config = withIosNativeReminderActionProject(config);
  config = withIosNativeReminderActionAppDelegate(config);
  return config;
};

module.exports = withIosNativeReminderActions;
