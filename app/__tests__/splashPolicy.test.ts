import fs from "node:fs";
import path from "node:path";

describe("root splash policy", () => {
  it("uses Expo automatic splash hiding", () => {
    const rootLayoutSource = fs.readFileSync(path.join(__dirname, "..", "_layout.tsx"), "utf8");

    expect(rootLayoutSource).not.toContain("preventAutoHideAsync");
    expect(rootLayoutSource).not.toContain("SplashScreen.hide");
  });
});
