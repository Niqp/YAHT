/**
 * YAHT Design System — Color Tokens
 *
 * Full light/dark palette for each color theme (sepia, clear, oled).
 * Rules:
 *  - Never hardcode hex values in components. Always use `colors.<token>` from `useTheme()`.
 *  - No new tokens without updating this file AND the guidelines doc.
 *  - Gradients only on large surfaces (full-width cards, page headers, FAB).
 */

export type ColorThemeName = "sepia" | "clear" | "oled";

const sepiaLight = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background: "#FAF7F2",
  surface: "#c7a97dff",
  cardBackground: "#FFFFFF",

  // ── Accent ───────────────────────────────────────────────────────────────
  primary: "#8B6F47",
  primaryMuted: "#A8916E",
  primarySubtle: "#D4C4AA",
  accent: "#C4813D",

  // ── Text ─────────────────────────────────────────────────────────────────
  text: "#2C2418",
  textSecondary: "#6B5D4F",
  textTertiary: "#9C8E7E",
  textInverse: "#FAF7F2",

  // ── Borders & Dividers ───────────────────────────────────────────────────
  border: "#E2D9CC",
  divider: "#EDE7DD",

  // ── Icons ─────────────────────────────────────────────────────────────────
  icon: "#7A6B5A",
  iconMuted: "#A89C8C",

  // ── Inputs ───────────────────────────────────────────────────────────────
  input: "#F5F0E8",
  inputBorder: "#D4C4AA",
  inputFocusBorder: "#8B6F47",

  // ── Semantic ─────────────────────────────────────────────────────────────
  success: "#5A8A5E",
  successSubtle: "#E8F0E8",
  error: "#C0523E",
  errorSubtle: "#FAE8E4",
  warning: "#C4813D",
  warningSubtle: "#FFF3E0",

  // ── Interactive ───────────────────────────────────────────────────────────
  buttonPrimary: "#8B6F47",
  buttonPrimaryText: "#FAF7F2",
  buttonSecondary: "#F5F0E8",
  buttonSecondaryText: "#8B6F47",
  buttonDisabled: "#D4C4AA",
  buttonDisabledText: "#A8916E",
  buttonDestructive: "#C0523E",

  // ── Tab Bar ───────────────────────────────────────────────────────────────
  tabBackground: "#FFFFFF",
  tabIconDefault: "#B0A494",
  tabIconSelected: "#8B6F47",

  // ── Utility ───────────────────────────────────────────────────────────────
  ripple: "rgba(139,111,71, 0.10)",
  shadow: "rgba(44,36,24, 0.08)",
  overlay: "rgba(44,36,24, 0.40)",

  // ── Legacy aliases (used by existing components — do not remove until migrated) ──
  /** @deprecated Use `primary` instead */
  selectedItem: "#8B6F47",
  /** @deprecated Use `accent` instead */
  todayIndicator: "#C4813D",
  /** @deprecated Use `surface` instead */
  habitBackground: "#F3EDE4",
  /** @deprecated Use `successSubtle` instead */
  habitCompleted: "#E8F0E8",

  // ── Gradients ─────────────────────────────────────────────────────────────
  gradientCardStart: "#FFFFFF",
  gradientCardEnd: "#FAF7F2",
  gradientHeaderStart: "#FAF7F2",
  gradientHeaderEnd: "#F3EDE4",
  gradientFabStart: "#9A7D55",
  gradientFabEnd: "#8B6F47",
};

const sepiaDark = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background: "#0f0d0bff",
  surface: "#1f1c16ff",
  cardBackground: "#2C2620",

  // ── Accent ───────────────────────────────────────────────────────────────
  primary: "#C4A882",
  primaryMuted: "#9C8568",
  primarySubtle: "#3D3428",
  accent: "#D4944A",

  // ── Text ─────────────────────────────────────────────────────────────────
  text: "#EDE5D8",
  textSecondary: "#A89C8C",
  textTertiary: "#6B5D4F",
  textInverse: "#1A1612",

  // ── Borders & Dividers ───────────────────────────────────────────────────
  border: "#3D3428",
  divider: "#302A22",

  // ── Icons ─────────────────────────────────────────────────────────────────
  icon: "#A89C8C",
  iconMuted: "#6B5D4F",

  // ── Inputs ───────────────────────────────────────────────────────────────
  input: "#2C2620",
  inputBorder: "#3D3428",
  inputFocusBorder: "#C4A882",

  // ── Semantic ─────────────────────────────────────────────────────────────
  success: "#7AAF7E",
  successSubtle: "#1E2B1E",
  error: "#E07060",
  errorSubtle: "#2E1C18",
  warning: "#D4944A",
  warningSubtle: "#2E2418",

  // ── Interactive ───────────────────────────────────────────────────────────
  buttonPrimary: "#C4A882",
  buttonPrimaryText: "#1A1612",
  buttonSecondary: "#2C2620",
  buttonSecondaryText: "#C4A882",
  buttonDisabled: "#3D3428",
  buttonDisabledText: "#6B5D4F",
  buttonDestructive: "#E07060",

  // ── Tab Bar ───────────────────────────────────────────────────────────────
  tabBackground: "#231F1A",
  tabIconDefault: "#5C5248",
  tabIconSelected: "#C4A882",

  // ── Utility ───────────────────────────────────────────────────────────────
  ripple: "rgba(196,168,130, 0.12)",
  shadow: "rgba(0,0,0, 0.30)",
  overlay: "rgba(0,0,0, 0.60)",

  // ── Legacy aliases (used by existing components — do not remove until migrated) ──
  /** @deprecated Use `primary` instead */
  selectedItem: "#C4A882",
  /** @deprecated Use `accent` instead */
  todayIndicator: "#D4944A",
  /** @deprecated Use `surface` instead */
  habitBackground: "#231F1A",
  /** @deprecated Use `successSubtle` instead */
  habitCompleted: "#1E2B1E",

  // ── Gradients ─────────────────────────────────────────────────────────────
  gradientCardStart: "#2C2620",
  gradientCardEnd: "#231F1A",
  gradientHeaderStart: "#231F1A",
  gradientHeaderEnd: "#1A1612",
  gradientFabStart: "#D4B892",
  gradientFabEnd: "#C4A882",
};

const clearLight = {
  // Backgrounds
  background: "#F6F8FB",
  surface: "#EAF0F7",
  cardBackground: "#FFFFFF",
  // Accent
  primary: "#3F74B5",
  primaryMuted: "#7099CC",
  primarySubtle: "#D9E6F6",
  accent: "#5D90D2",
  // Text
  text: "#18212C",
  textSecondary: "#4F6278",
  textTertiary: "#76879B",
  textInverse: "#F6F8FB",
  // Borders and dividers
  border: "#D5DFEB",
  divider: "#E5ECF4",
  // Icons
  icon: "#5A6E84",
  iconMuted: "#98A8BC",
  // Inputs
  input: "#EFF3F8",
  inputBorder: "#C9D5E5",
  inputFocusBorder: "#3F74B5",
  // Semantic
  success: "#2E7D42",
  successSubtle: "#E8F5E9",
  error: "#C62828",
  errorSubtle: "#FFEBEE",
  warning: "#E65100",
  warningSubtle: "#FFF3E0",
  // Interactive
  buttonPrimary: "#3F74B5",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#E6EDF6",
  buttonSecondaryText: "#3F74B5",
  buttonDisabled: "#CCD7E4",
  buttonDisabledText: "#94A7BD",
  buttonDestructive: "#C62828",
  // Tab bar
  tabBackground: "#FFFFFF",
  tabIconDefault: "#98A8BC",
  tabIconSelected: "#3F74B5",
  // Utility
  ripple: "rgba(63,116,181, 0.12)",
  shadow: "rgba(0,0,0, 0.08)",
  overlay: "rgba(0,0,0, 0.40)",
  // Legacy aliases
  /** @deprecated */ selectedItem: "#3F74B5",
  /** @deprecated */ todayIndicator: "#5D90D2",
  /** @deprecated */ habitBackground: "#EAF0F7",
  /** @deprecated */ habitCompleted: "#E8F5E9",
  // Gradients
  gradientCardStart: "#FFFFFF",
  gradientCardEnd: "#F6F8FB",
  gradientHeaderStart: "#F6F8FB",
  gradientHeaderEnd: "#EAF0F7",
  gradientFabStart: "#5A8CCB",
  gradientFabEnd: "#3F74B5",
};
const clearDark = {
  // Backgrounds
  background: "#0F1620",
  surface: "#162130",
  cardBackground: "#1D2A3A",
  // Accent
  primary: "#7FB1E8",
  primaryMuted: "#5F8FC2",
  primarySubtle: "#22384F",
  accent: "#95C2F5",
  // Text
  text: "#E7EEF8",
  textSecondary: "#B2C0D2",
  textTertiary: "#7A8FA9",
  textInverse: "#0F1620",
  // Borders and dividers
  border: "#2D415A",
  divider: "#25374D",
  // Icons
  icon: "#B2C0D2",
  iconMuted: "#6F839B",
  // Inputs
  input: "#1D2A3A",
  inputBorder: "#2D415A",
  inputFocusBorder: "#7FB1E8",
  // Semantic
  success: "#66BB6A",
  successSubtle: "#14261A",
  error: "#EF5350",
  errorSubtle: "#2B1616",
  warning: "#FFA726",
  warningSubtle: "#2D2112",
  // Interactive
  buttonPrimary: "#7FB1E8",
  buttonPrimaryText: "#0F1620",
  buttonSecondary: "#1D2A3A",
  buttonSecondaryText: "#7FB1E8",
  buttonDisabled: "#2D415A",
  buttonDisabledText: "#6F839B",
  buttonDestructive: "#EF5350",
  // Tab bar
  tabBackground: "#162130",
  tabIconDefault: "#6F839B",
  tabIconSelected: "#7FB1E8",
  // Utility
  ripple: "rgba(127,177,232, 0.12)",
  shadow: "rgba(0,0,0, 0.35)",
  overlay: "rgba(0,0,0, 0.62)",
  // Legacy aliases
  /** @deprecated */ selectedItem: "#7FB1E8",
  /** @deprecated */ todayIndicator: "#95C2F5",
  /** @deprecated */ habitBackground: "#162130",
  /** @deprecated */ habitCompleted: "#14261A",
  // Gradients
  gradientCardStart: "#1D2A3A",
  gradientCardEnd: "#162130",
  gradientHeaderStart: "#162130",
  gradientHeaderEnd: "#0F1620",
  gradientFabStart: "#95C2F5",
  gradientFabEnd: "#7FB1E8",
};
// OLED light intentionally shares the same tokens as clear light.
const oledLight = clearLight;
const oledDark = {
  // Backgrounds
  background: "#000000",
  surface: "#050B14",
  cardBackground: "#0B1320",
  // Accent
  primary: "#7FB1E8",
  primaryMuted: "#5F8FC2",
  primarySubtle: "#142638",
  accent: "#95C2F5",
  // Text
  text: "#EDF3FB",
  textSecondary: "#B4C2D5",
  textTertiary: "#758AA5",
  textInverse: "#000000",
  // Borders and dividers
  border: "#1A2B40",
  divider: "#132235",
  // Icons
  icon: "#B4C2D5",
  iconMuted: "#6A7F98",
  // Inputs
  input: "#0B1320",
  inputBorder: "#1A2B40",
  inputFocusBorder: "#7FB1E8",
  // Semantic
  success: "#66BB6A",
  successSubtle: "#0D1D13",
  error: "#EF5350",
  errorSubtle: "#220F0F",
  warning: "#FFA726",
  warningSubtle: "#241A0E",
  // Interactive
  buttonPrimary: "#7FB1E8",
  buttonPrimaryText: "#000000",
  buttonSecondary: "#0B1320",
  buttonSecondaryText: "#7FB1E8",
  buttonDisabled: "#1A2B40",
  buttonDisabledText: "#566B84",
  buttonDestructive: "#EF5350",
  // Tab bar
  tabBackground: "#000000",
  tabIconDefault: "#4D6078",
  tabIconSelected: "#7FB1E8",
  // Utility
  ripple: "rgba(127,177,232, 0.14)",
  shadow: "rgba(0,0,0, 0.45)",
  overlay: "rgba(0,0,0, 0.74)",
  // Legacy aliases
  /** @deprecated */ selectedItem: "#7FB1E8",
  /** @deprecated */ todayIndicator: "#95C2F5",
  /** @deprecated */ habitBackground: "#050B14",
  /** @deprecated */ habitCompleted: "#0D1D13",
  // Gradients
  gradientCardStart: "#0B1320",
  gradientCardEnd: "#050B14",
  gradientHeaderStart: "#050B14",
  gradientHeaderEnd: "#000000",
  gradientFabStart: "#95C2F5",
  gradientFabEnd: "#7FB1E8",
};
export const Colors = {
  sepia: { light: sepiaLight, dark: sepiaDark },
  clear: { light: clearLight, dark: clearDark },
  oled: { light: oledLight, dark: oledDark },
};

/** Type for accessing color tokens — derived from the sepia light theme shape. */
export type ColorTheme = typeof sepiaLight;
