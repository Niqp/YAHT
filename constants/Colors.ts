/**
 * YAHT Design System - Color Tokens
 *
 * Public color tokens are semantic roles. Components should consume these via
 * `useTheme().colors` and should not depend on raw palette values or component
 * one-off aliases.
 */

export type ColorThemeName = "sepia" | "clear" | "oled";
export type ColorSchemeName = "light" | "dark";

export type ColorTheme = {
  bgApp: string;
  bgChrome: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  bgInset: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textOnAccent: string;
  textOnStrong: string;

  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  borderFocus: string;

  iconPrimary: string;
  iconSecondary: string;
  iconDisabled: string;
  iconAccent: string;
  iconSuccess: string;
  iconDanger: string;

  accent: string;
  accentMuted: string;
  accentSoftBg: string;
  accentSoftBorder: string;

  success: string;
  successSoftBg: string;
  successSoftBorder: string;

  danger: string;
  dangerSoftBg: string;
  warning: string;
  warningSoftBg: string;

  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  inputPlaceholder: string;
  pickerSelectionBg: string;

  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryBorder: string;
  buttonSecondaryText: string;
  buttonDisabledBg: string;
  buttonDisabledText: string;
  buttonDangerBg: string;
  buttonDangerText: string;

  chipBg: string;
  chipBorder: string;
  chipText: string;
  chipSelectedBg: string;
  chipSelectedBorder: string;
  chipSelectedText: string;

  toggleOffTrack: string;
  toggleOffThumb: string;
  toggleOnTrack: string;
  toggleOnThumb: string;

  navBg: string;
  navBorder: string;
  navItemIdle: string;
  navItemActive: string;

  overlay: string;
  ripple: string;
  shadow: string;

  gradientHeaderStart: string;
  gradientHeaderMid: string;
  gradientHeaderEnd: string;
  gradientFabStart: string;
  gradientFabEnd: string;
};

const sepiaLight: ColorTheme = {
  bgApp: "#FAF7F2",
  bgChrome: "#F3EDE4",
  bgSurface: "#FFFFFF",
  bgSurfaceElevated: "#FBF6EF",
  bgInset: "#F5F0E8",

  textPrimary: "#2C2418",
  textSecondary: "#6B5D4F",
  textTertiary: "#9C8E7E",
  textDisabled: "#B3A694",
  textOnAccent: "#FAF7F2",
  textOnStrong: "#2C2418",

  borderSubtle: "rgba(44,36,24,0.06)",
  borderDefault: "rgba(44,36,24,0.10)",
  borderStrong: "rgba(44,36,24,0.16)",
  borderFocus: "#8B6F47",

  iconPrimary: "#7A6B5A",
  iconSecondary: "#9C8E7E",
  iconDisabled: "#B3A694",
  iconAccent: "#8B6F47",
  iconSuccess: "#739E73",
  iconDanger: "#C0523E",

  accent: "#8B6F47",
  accentMuted: "#A8916E",
  accentSoftBg: "rgba(139,111,71,0.16)",
  accentSoftBorder: "rgba(139,111,71,0.32)",

  success: "#739E73",
  successSoftBg: "rgba(115,158,115,0.10)",
  successSoftBorder: "rgba(115,158,115,0.36)",

  danger: "#C0523E",
  dangerSoftBg: "rgba(192,82,62,0.10)",
  warning: "#C4813D",
  warningSoftBg: "rgba(196,129,61,0.10)",

  inputBg: "#F5F0E8",
  inputBorder: "rgba(44,36,24,0.10)",
  inputBorderFocus: "#8B6F47",
  inputPlaceholder: "#9C8E7E",
  pickerSelectionBg: "rgba(139,111,71,0.16)",

  buttonPrimaryBg: "#8B6F47",
  buttonPrimaryText: "#FAF7F2",
  buttonSecondaryBg: "#F5F0E8",
  buttonSecondaryBorder: "rgba(44,36,24,0.14)",
  buttonSecondaryText: "#2C2418",
  buttonDisabledBg: "#E3D8C8",
  buttonDisabledText: "#A8916E",
  buttonDangerBg: "#C0523E",
  buttonDangerText: "#FAF7F2",

  chipBg: "#EFE6D8",
  chipBorder: "rgba(44,36,24,0.14)",
  chipText: "#6B5D4F",
  chipSelectedBg: "rgba(139,111,71,0.18)",
  chipSelectedBorder: "rgba(139,111,71,0.38)",
  chipSelectedText: "#2C2418",

  toggleOffTrack: "#DCCFBE",
  toggleOffThumb: "#FAF7F2",
  toggleOnTrack: "#8B6F47",
  toggleOnThumb: "#FAF7F2",

  navBg: "#FFFFFF",
  navBorder: "rgba(44,36,24,0.06)",
  navItemIdle: "#9C8E7E",
  navItemActive: "#8B6F47",

  overlay: "rgba(44,36,24,0.40)",
  ripple: "rgba(139,111,71,0.10)",
  shadow: "rgba(44,36,24,0.08)",

  gradientHeaderStart: "#e0b67cff",
  gradientHeaderMid: "#f0d8b0ff",
  gradientHeaderEnd: "#FAF7F2",
  gradientFabStart: "#9A7D55",
  gradientFabEnd: "#8B6F47",
};

const sepiaDark: ColorTheme = {
  bgApp: "#130F0A",
  bgChrome: "#2D2114",
  bgSurface: "#2A2117",
  bgSurfaceElevated: "#352819",
  bgInset: "#423322",

  textPrimary: "#F4E8D6",
  textSecondary: "#D0C0AA",
  textTertiary: "#A49178",
  textDisabled: "#77664F",
  textOnAccent: "#1B130A",
  textOnStrong: "#F4E8D6",

  borderSubtle: "rgba(244,232,214,0.10)",
  borderDefault: "rgba(244,232,214,0.16)",
  borderStrong: "rgba(244,232,214,0.24)",
  borderFocus: "#D6B879",

  iconPrimary: "#D0C0AA",
  iconSecondary: "#A49178",
  iconDisabled: "#77664F",
  iconAccent: "#D6B879",
  iconSuccess: "#7AAF7E",
  iconDanger: "#E07060",

  accent: "#D6B879",
  accentMuted: "#B99A62",
  accentSoftBg: "rgba(214,184,121,0.26)",
  accentSoftBorder: "rgba(214,184,121,0.54)",

  success: "#7AAF7E",
  successSoftBg: "rgba(122,175,126,0.10)",
  successSoftBorder: "rgba(122,175,126,0.42)",

  danger: "#E07060",
  dangerSoftBg: "rgba(224,112,96,0.10)",
  warning: "#D4944A",
  warningSoftBg: "rgba(212,148,74,0.10)",

  inputBg: "#423322",
  inputBorder: "rgba(244,232,214,0.18)",
  inputBorderFocus: "#D6B879",
  inputPlaceholder: "#A49178",
  pickerSelectionBg: "rgba(214,184,121,0.20)",

  buttonPrimaryBg: "#D6B879",
  buttonPrimaryText: "#1B130A",
  buttonSecondaryBg: "#352819",
  buttonSecondaryBorder: "rgba(244,232,214,0.24)",
  buttonSecondaryText: "#F4E8D6",
  buttonDisabledBg: "#423322",
  buttonDisabledText: "#77664F",
  buttonDangerBg: "#E07060",
  buttonDangerText: "#1B130A",

  chipBg: "#4B3D2C",
  chipBorder: "rgba(244,232,214,0.22)",
  chipText: "#D0C0AA",
  chipSelectedBg: "rgba(214,184,121,0.32)",
  chipSelectedBorder: "rgba(214,184,121,0.66)",
  chipSelectedText: "#FFF4DE",

  toggleOffTrack: "#5A4935",
  toggleOffThumb: "#D0C0AA",
  toggleOnTrack: "#D6B879",
  toggleOnThumb: "#FFF4DE",

  navBg: "#17120C",
  navBorder: "rgba(244,232,214,0.10)",
  navItemIdle: "#A49178",
  navItemActive: "#D6B879",

  overlay: "rgba(0,0,0,0.68)",
  ripple: "rgba(214,184,121,0.16)",
  shadow: "rgba(0,0,0,0.34)",

  gradientHeaderStart: "#2B1F13",
  gradientHeaderMid: "#261B10",
  gradientHeaderEnd: "#130F0A",
  gradientFabStart: "#E5C984",
  gradientFabEnd: "#D6B879",
};

const clearLight: ColorTheme = {
  bgApp: "#F6F8FB",
  bgChrome: "#EAF0F7",
  bgSurface: "#FFFFFF",
  bgSurfaceElevated: "#F9FBFE",
  bgInset: "#EFF3F8",

  textPrimary: "#18212C",
  textSecondary: "#4F6278",
  textTertiary: "#76879B",
  textDisabled: "#A6B4C6",
  textOnAccent: "#FFFFFF",
  textOnStrong: "#18212C",

  borderSubtle: "rgba(24,33,44,0.06)",
  borderDefault: "rgba(24,33,44,0.11)",
  borderStrong: "rgba(24,33,44,0.18)",
  borderFocus: "#3F74B5",

  iconPrimary: "#5A6E84",
  iconSecondary: "#76879B",
  iconDisabled: "#A6B4C6",
  iconAccent: "#3F74B5",
  iconSuccess: "#3D9653",
  iconDanger: "#C62828",

  accent: "#3F74B5",
  accentMuted: "#7099CC",
  accentSoftBg: "rgba(63,116,181,0.16)",
  accentSoftBorder: "rgba(63,116,181,0.32)",

  success: "#3D9653",
  successSoftBg: "rgba(61,150,83,0.10)",
  successSoftBorder: "rgba(61,150,83,0.36)",

  danger: "#C62828",
  dangerSoftBg: "rgba(198,40,40,0.10)",
  warning: "#E65100",
  warningSoftBg: "rgba(230,81,0,0.10)",

  inputBg: "#EFF3F8",
  inputBorder: "rgba(24,33,44,0.12)",
  inputBorderFocus: "#3F74B5",
  inputPlaceholder: "#76879B",
  pickerSelectionBg: "rgba(63,116,181,0.16)",

  buttonPrimaryBg: "#3F74B5",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondaryBg: "#E6EDF6",
  buttonSecondaryBorder: "rgba(24,33,44,0.14)",
  buttonSecondaryText: "#18212C",
  buttonDisabledBg: "#CCD7E4",
  buttonDisabledText: "#94A7BD",
  buttonDangerBg: "#C62828",
  buttonDangerText: "#FFFFFF",

  chipBg: "#E6EDF6",
  chipBorder: "rgba(24,33,44,0.15)",
  chipText: "#4F6278",
  chipSelectedBg: "rgba(63,116,181,0.16)",
  chipSelectedBorder: "rgba(63,116,181,0.34)",
  chipSelectedText: "#18212C",

  toggleOffTrack: "#D5DFEB",
  toggleOffThumb: "#FFFFFF",
  toggleOnTrack: "#3F74B5",
  toggleOnThumb: "#FFFFFF",

  navBg: "#FFFFFF",
  navBorder: "rgba(24,33,44,0.06)",
  navItemIdle: "#98A8BC",
  navItemActive: "#3F74B5",

  overlay: "rgba(0,0,0,0.40)",
  ripple: "rgba(63,116,181,0.12)",
  shadow: "rgba(0,0,0,0.08)",

  gradientHeaderStart: "#B5CBE4",
  gradientHeaderMid: "#DDE8F5",
  gradientHeaderEnd: "#F6F8FB",
  gradientFabStart: "#5A8CCB",
  gradientFabEnd: "#3F74B5",
};

const clearDark: ColorTheme = {
  bgApp: "#0F1620",
  bgChrome: "#162130",
  bgSurface: "#1D2A3A",
  bgSurfaceElevated: "#26384D",
  bgInset: "#2D415A",

  textPrimary: "#E7EEF8",
  textSecondary: "#C5CFDF",
  textTertiary: "#9BAAC0",
  textDisabled: "#6F839B",
  textOnAccent: "#0F1620",
  textOnStrong: "#E7EEF8",

  borderSubtle: "rgba(231,238,248,0.08)",
  borderDefault: "rgba(231,238,248,0.13)",
  borderStrong: "rgba(231,238,248,0.20)",
  borderFocus: "#7FB1E8",

  iconPrimary: "#B2C0D2",
  iconSecondary: "#9BAAC0",
  iconDisabled: "#6F839B",
  iconAccent: "#7FB1E8",
  iconSuccess: "#66BB6A",
  iconDanger: "#EF5350",

  accent: "#7FB1E8",
  accentMuted: "#5F8FC2",
  accentSoftBg: "rgba(127,177,232,0.22)",
  accentSoftBorder: "rgba(127,177,232,0.42)",

  success: "#66BB6A",
  successSoftBg: "rgba(102,187,106,0.10)",
  successSoftBorder: "rgba(102,187,106,0.46)",

  danger: "#EF5350",
  dangerSoftBg: "rgba(239,83,80,0.10)",
  warning: "#FFA726",
  warningSoftBg: "rgba(255,167,38,0.10)",

  inputBg: "#2D415A",
  inputBorder: "rgba(231,238,248,0.12)",
  inputBorderFocus: "#7FB1E8",
  inputPlaceholder: "#9BAAC0",
  pickerSelectionBg: "rgba(127,177,232,0.18)",

  buttonPrimaryBg: "#7FB1E8",
  buttonPrimaryText: "#0F1620",
  buttonSecondaryBg: "#1D2A3A",
  buttonSecondaryBorder: "rgba(231,238,248,0.18)",
  buttonSecondaryText: "#E7EEF8",
  buttonDisabledBg: "#2D415A",
  buttonDisabledText: "#6F839B",
  buttonDangerBg: "#EF5350",
  buttonDangerText: "#0F1620",

  chipBg: "#26384D",
  chipBorder: "rgba(231,238,248,0.18)",
  chipText: "#C5CFDF",
  chipSelectedBg: "rgba(127,177,232,0.22)",
  chipSelectedBorder: "rgba(127,177,232,0.46)",
  chipSelectedText: "#E7EEF8",

  toggleOffTrack: "#405871",
  toggleOffThumb: "#C5CFDF",
  toggleOnTrack: "#7FB1E8",
  toggleOnThumb: "#E7EEF8",

  navBg: "#162130",
  navBorder: "rgba(231,238,248,0.08)",
  navItemIdle: "#6F839B",
  navItemActive: "#7FB1E8",

  overlay: "rgba(0,0,0,0.62)",
  ripple: "rgba(127,177,232,0.12)",
  shadow: "rgba(0,0,0,0.35)",

  gradientHeaderStart: "#1C2B3E",
  gradientHeaderMid: "#1A293B",
  gradientHeaderEnd: "#0F1620",
  gradientFabStart: "#95C2F5",
  gradientFabEnd: "#7FB1E8",
};

const oledLight: ColorTheme = clearLight;

const oledDark: ColorTheme = {
  bgApp: "#000000",
  bgChrome: "#050B14",
  bgSurface: "#0B1320",
  bgSurfaceElevated: "#142638",
  bgInset: "#1A2B40",

  textPrimary: "#EDF3FB",
  textSecondary: "#C9D4E3",
  textTertiary: "#9AAEC4",
  textDisabled: "#566B84",
  textOnAccent: "#000000",
  textOnStrong: "#EDF3FB",

  borderSubtle: "rgba(237,243,251,0.08)",
  borderDefault: "rgba(237,243,251,0.14)",
  borderStrong: "rgba(237,243,251,0.22)",
  borderFocus: "#7FB1E8",

  iconPrimary: "#B4C2D5",
  iconSecondary: "#9AAEC4",
  iconDisabled: "#566B84",
  iconAccent: "#7FB1E8",
  iconSuccess: "#66BB6A",
  iconDanger: "#EF5350",

  accent: "#7FB1E8",
  accentMuted: "#5F8FC2",
  accentSoftBg: "rgba(127,177,232,0.24)",
  accentSoftBorder: "rgba(127,177,232,0.50)",

  success: "#66BB6A",
  successSoftBg: "rgba(102,187,106,0.12)",
  successSoftBorder: "rgba(102,187,106,0.50)",

  danger: "#EF5350",
  dangerSoftBg: "rgba(239,83,80,0.12)",
  warning: "#FFA726",
  warningSoftBg: "rgba(255,167,38,0.12)",

  inputBg: "#1A2B40",
  inputBorder: "rgba(237,243,251,0.14)",
  inputBorderFocus: "#7FB1E8",
  inputPlaceholder: "#9AAEC4",
  pickerSelectionBg: "rgba(127,177,232,0.20)",

  buttonPrimaryBg: "#7FB1E8",
  buttonPrimaryText: "#000000",
  buttonSecondaryBg: "#0B1320",
  buttonSecondaryBorder: "rgba(237,243,251,0.22)",
  buttonSecondaryText: "#EDF3FB",
  buttonDisabledBg: "#1A2B40",
  buttonDisabledText: "#566B84",
  buttonDangerBg: "#EF5350",
  buttonDangerText: "#000000",

  chipBg: "#142638",
  chipBorder: "rgba(237,243,251,0.20)",
  chipText: "#C9D4E3",
  chipSelectedBg: "rgba(127,177,232,0.24)",
  chipSelectedBorder: "rgba(127,177,232,0.52)",
  chipSelectedText: "#EDF3FB",

  toggleOffTrack: "#24374F",
  toggleOffThumb: "#C9D4E3",
  toggleOnTrack: "#7FB1E8",
  toggleOnThumb: "#EDF3FB",

  navBg: "#000000",
  navBorder: "rgba(237,243,251,0.08)",
  navItemIdle: "#4D6078",
  navItemActive: "#7FB1E8",

  overlay: "rgba(0,0,0,0.74)",
  ripple: "rgba(127,177,232,0.14)",
  shadow: "rgba(0,0,0,0.45)",

  gradientHeaderStart: "#06101D",
  gradientHeaderMid: "#050D18",
  gradientHeaderEnd: "#000000",
  gradientFabStart: "#95C2F5",
  gradientFabEnd: "#7FB1E8",
};

export const Colors: Record<ColorThemeName, Record<ColorSchemeName, ColorTheme>> = {
  sepia: { light: sepiaLight, dark: sepiaDark },
  clear: { light: clearLight, dark: clearDark },
  oled: { light: oledLight, dark: oledDark },
};
