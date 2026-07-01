import { Platform } from "react-native";

import { getElevation } from "@/constants/Elevation";

describe("getElevation", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    (Platform as { OS: typeof Platform.OS }).OS = originalOS;
  });

  it("uses native iOS shadow props instead of CSS boxShadow", () => {
    (Platform as { OS: typeof Platform.OS }).OS = "ios";

    const style = getElevation(2, "rgba(0,0,0,0.5)");

    expect(style).toEqual({
      shadowColor: "rgba(0,0,0,0.5)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    });
    expect(style).not.toHaveProperty("boxShadow");
  });

  it("keeps Android elevation separate from iOS shadows", () => {
    (Platform as { OS: typeof Platform.OS }).OS = "android";

    expect(getElevation(3, "rgba(0,0,0,0.5)")).toEqual({ elevation: 8 });
  });
});
