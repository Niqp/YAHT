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
  dangerSoftBorder: string;
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
  bgApp: "#FBF7F1",
  bgChrome: "#F6EADC",
  bgSurface: "#FFFDF9",
  bgSurfaceElevated: "#FFF9F2",
  bgInset: "#F6EADC",

  textPrimary: "#2F1F1A",
  textSecondary: "#715F54",
  textTertiary: "#9B8779",
  textDisabled: "#B9A79B",
  textOnAccent: "#FFFFFF",
  textOnStrong: "#2F1F1A",

  borderSubtle: "rgba(47,31,26,0.06)",
  borderDefault: "rgba(47,31,26,0.095)",
  borderStrong: "rgba(47,31,26,0.15)",
  borderFocus: "#8D6140",

  iconPrimary: "#715F54",
  iconSecondary: "#9B8779",
  iconDisabled: "#B9A79B",
  iconAccent: "#8D6140",
  iconSuccess: "#75956F",
  iconDanger: "#B26450",

  accent: "#8D6140",
  accentMuted: "#B98D62",
  accentSoftBg: "rgba(185,141,98,0.16)",
  accentSoftBorder: "rgba(185,141,98,0.32)",

  success: "#75956F",
  successSoftBg: "#F0F5EE",
  successSoftBorder: "rgba(117,149,111,0.38)",

  danger: "#B26450",
  dangerSoftBg: "#FCF0EC",
  dangerSoftBorder: "rgba(178,100,80,0.30)",
  warning: "#9A6C48",
  warningSoftBg: "rgba(185,141,98,0.12)",

  inputBg: "#F6EADC",
  inputBorder: "rgba(47,31,26,0.095)",
  inputBorderFocus: "#8D6140",
  inputPlaceholder: "#9B8779",
  pickerSelectionBg: "rgba(185,141,98,0.16)",

  buttonPrimaryBg: "#8D6140",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondaryBg: "#F6EADC",
  buttonSecondaryBorder: "rgba(47,31,26,0.15)",
  buttonSecondaryText: "#2F1F1A",
  buttonDisabledBg: "#E9D9C8",
  buttonDisabledText: "#A8805C",
  buttonDangerBg: "#A54F3E",
  buttonDangerText: "#FFFAF4",

  chipBg: "#F3E4D6",
  chipBorder: "rgba(47,31,26,0.14)",
  chipText: "#715F54",
  chipSelectedBg: "rgba(185,141,98,0.18)",
  chipSelectedBorder: "rgba(185,141,98,0.36)",
  chipSelectedText: "#2F1F1A",

  toggleOffTrack: "#E0D0C0",
  toggleOffThumb: "#FFFAF4",
  toggleOnTrack: "#B98D62",
  toggleOnThumb: "#FFFAF4",

  navBg: "#FFFDF9",
  navBorder: "rgba(47,31,26,0.06)",
  navItemIdle: "#9B8779",
  navItemActive: "#8D6140",

  overlay: "rgba(47,31,26,0.40)",
  ripple: "rgba(185,141,98,0.10)",
  shadow: "rgba(47,31,26,0.055)",

  gradientHeaderStart: "#E8D0B5",
  gradientHeaderMid: "#F5E8D9",
  gradientHeaderEnd: "#FBF7F1",
  gradientFabStart: "#C79770",
  gradientFabEnd: "#B98D62",
};

const sepiaDark: ColorTheme = {
  bgApp: "#16110D",
  bgChrome: "#231A12",
  bgSurface: "#241B14",
  bgSurfaceElevated: "#2E241B",
  bgInset: "#3A2E22",

  textPrimary: "#F5E8D6",
  textSecondary: "#D1C0A9",
  textTertiary: "#A9947B",
  textDisabled: "#746657",
  textOnAccent: "#22170C",
  textOnStrong: "#F5E8D6",

  borderSubtle: "rgba(245,232,214,0.08)",
  borderDefault: "rgba(245,232,214,0.13)",
  borderStrong: "rgba(245,232,214,0.22)",
  borderFocus: "#D0AD73",

  iconPrimary: "#D1C0A9",
  iconSecondary: "#A9947B",
  iconDisabled: "#746657",
  iconAccent: "#D0AD73",
  iconSuccess: "#81A978",
  iconDanger: "#E07060",

  accent: "#D0AD73",
  accentMuted: "#BC925A",
  accentSoftBg: "rgba(188,146,90,0.20)",
  accentSoftBorder: "rgba(188,146,90,0.40)",

  success: "#81A978",
  successSoftBg: "rgba(129,169,120,0.10)",
  successSoftBorder: "rgba(129,169,120,0.38)",

  danger: "#E07060",
  dangerSoftBg: "rgba(224,112,96,0.10)",
  dangerSoftBorder: "rgba(224,112,96,0.46)",
  warning: "#C89D5F",
  warningSoftBg: "rgba(200,157,95,0.10)",

  inputBg: "#3A2E22",
  inputBorder: "rgba(245,232,214,0.16)",
  inputBorderFocus: "#D0AD73",
  inputPlaceholder: "#A9947B",
  pickerSelectionBg: "rgba(188,146,90,0.20)",

  buttonPrimaryBg: "#BC925A",
  buttonPrimaryText: "#22170C",
  buttonSecondaryBg: "#2E241B",
  buttonSecondaryBorder: "rgba(245,232,214,0.22)",
  buttonSecondaryText: "#F5E8D6",
  buttonDisabledBg: "#3A2E22",
  buttonDisabledText: "#746657",
  buttonDangerBg: "#E07060",
  buttonDangerText: "#1B130A",

  chipBg: "#453728",
  chipBorder: "rgba(245,232,214,0.20)",
  chipText: "#D1C0A9",
  chipSelectedBg: "rgba(188,146,90,0.30)",
  chipSelectedBorder: "rgba(188,146,90,0.56)",
  chipSelectedText: "#FFF4DE",

  toggleOffTrack: "#544536",
  toggleOffThumb: "#D1C0A9",
  toggleOnTrack: "#BC925A",
  toggleOnThumb: "#FFF4DE",

  navBg: "#17120C",
  navBorder: "rgba(245,232,214,0.09)",
  navItemIdle: "#A9947B",
  navItemActive: "#D0AD73",

  overlay: "rgba(0,0,0,0.68)",
  ripple: "rgba(188,146,90,0.16)",
  shadow: "rgba(0,0,0,0.30)",

  gradientHeaderStart: "#231A12",
  gradientHeaderMid: "#1C150F",
  gradientHeaderEnd: "#16110D",
  gradientFabStart: "#D0AD73",
  gradientFabEnd: "#BC925A",
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
  dangerSoftBorder: "rgba(198,40,40,0.34)",
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
  dangerSoftBorder: "rgba(239,83,80,0.44)",
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
  dangerSoftBorder: "rgba(239,83,80,0.50)",
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
