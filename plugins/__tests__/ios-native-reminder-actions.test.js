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
});
