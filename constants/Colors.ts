/**
 * YAHT Design System — Color Tokens
 *
 * Full light/dark palette as specified in UI_UX_GUIDELINES.md §2.
 * Rules:
 *  - Never hardcode hex values in components. Always use `colors.<token>` from `useTheme()`.
 *  - No new tokens without updating this file AND the guidelines doc.
 *  - Gradients only on large surfaces (full-width cards, page headers, FAB).
 */

export const Colors = {
  light: {
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
  },

  dark: {
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
  },
};

/** Type for accessing color tokens — derived from the light theme shape. */
export type ColorTheme = typeof Colors.light;
