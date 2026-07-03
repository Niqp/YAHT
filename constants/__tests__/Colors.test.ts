import { Colors } from "@/constants/Colors";

describe("Colors", () => {
  it("uses the approved neutral coffee anchors for light sepia", () => {
    expect(Colors.sepia.light).toEqual(
      expect.objectContaining({
        bgApp: "#FBF7F1",
        bgSurface: "#FFFDF9",
        bgInset: "#F6EADC",
        textPrimary: "#2F1F1A",
        textSecondary: "#715F54",
        accent: "#8D6140",
        accentMuted: "#B98D62",
        textOnAccent: "#FFFFFF",
        buttonPrimaryBg: "#8D6140",
        buttonPrimaryText: "#FFFFFF",
        gradientHeaderStart: "#E8D0B5",
        gradientHeaderMid: "#F5E8D9",
        gradientHeaderEnd: "#FBF7F1",
        gradientFabStart: "#C79770",
        gradientFabEnd: "#B98D62",
      })
    );
  });

  it("uses the approved dark mocha anchors for dark sepia", () => {
    expect(Colors.sepia.dark).toEqual(
      expect.objectContaining({
        bgApp: "#16110D",
        bgSurface: "#241B14",
        bgSurfaceElevated: "#2E241B",
        bgInset: "#3A2E22",
        textPrimary: "#F5E8D6",
        textSecondary: "#D1C0A9",
        accent: "#D0AD73",
        accentMuted: "#BC925A",
        textOnAccent: "#22170C",
        buttonPrimaryBg: "#BC925A",
        buttonPrimaryText: "#22170C",
        gradientHeaderStart: "#231A12",
        gradientHeaderMid: "#1C150F",
        gradientHeaderEnd: "#16110D",
        gradientFabStart: "#D0AD73",
        gradientFabEnd: "#BC925A",
      })
    );
  });

  it("keeps light sepia accent text and filled controls readable", () => {
    const contrast = (foreground: string, background: string) => {
      const channel = (hex: string, start: number) => parseInt(hex.slice(start, start + 2), 16) / 255;
      const linearize = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      const luminance = (hex: string) => {
        const rgb = [channel(hex, 1), channel(hex, 3), channel(hex, 5)].map(linearize);
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      };
      const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);

      return (lighter + 0.05) / (darker + 0.05);
    };

    expect(Colors.sepia.light.textOnAccent).toBe(Colors.clear.light.textOnAccent);
    expect(Colors.sepia.light.buttonPrimaryText).toBe(Colors.clear.light.buttonPrimaryText);
    expect(Colors.sepia.light.buttonPrimaryBg).toBe(Colors.sepia.light.accent);
    expect(contrast(Colors.sepia.light.accent, Colors.sepia.light.bgSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(Colors.sepia.light.textOnAccent, Colors.sepia.light.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(Colors.sepia.light.buttonPrimaryText, Colors.sepia.light.buttonPrimaryBg)).toBeGreaterThanOrEqual(
      4.5
    );
    expect(contrast(Colors.sepia.light.buttonDangerText, Colors.sepia.light.buttonDangerBg)).toBeGreaterThanOrEqual(
      4.5
    );
  });

  it("keeps dark sepia accent text and filled controls readable", () => {
    const contrast = (foreground: string, background: string) => {
      const channel = (hex: string, start: number) => parseInt(hex.slice(start, start + 2), 16) / 255;
      const linearize = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      const luminance = (hex: string) => {
        const rgb = [channel(hex, 1), channel(hex, 3), channel(hex, 5)].map(linearize);
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      };
      const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);

      return (lighter + 0.05) / (darker + 0.05);
    };

    expect(contrast(Colors.sepia.dark.accent, Colors.sepia.dark.bgSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(Colors.sepia.dark.textOnAccent, Colors.sepia.dark.accentMuted)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(Colors.sepia.dark.buttonPrimaryText, Colors.sepia.dark.buttonPrimaryBg)).toBeGreaterThanOrEqual(
      4.5
    );
    expect(contrast(Colors.sepia.dark.buttonDangerText, Colors.sepia.dark.buttonDangerBg)).toBeGreaterThanOrEqual(4.5);
  });
});
