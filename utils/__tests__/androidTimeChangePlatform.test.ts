import fs from "fs";
import path from "path";

const projectRoot = path.resolve(__dirname, "../..");

const readProjectFile = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("Android time change platform boundaries", () => {
  it("does not make Metro watch the local Android time change package", () => {
    const metroConfig = readProjectFile("metro.config.js");

    expect(metroConfig).not.toContain("../react-native-android-time-change");
    expect(metroConfig).not.toContain("watchFolders");
  });

  it("keeps default iOS/web entrypoints from importing the Android native package", () => {
    const defaultEntrypoints = [
      "hooks/useTimeChangeManager.ts",
      "utils/registerTimeChangeTask.ts",
      "utils/timeChange.ts",
    ];

    for (const filePath of defaultEntrypoints) {
      expect(readProjectFile(filePath)).not.toContain("@niqp/react-native-android-time-change");
    }
  });
});
