/**
 * YAHT Design System — Elevation & Shadow Presets
 *
 * Platform-aware shadow styles as specified in UI_UX_GUIDELINES.md §6.
 * Rules:
 *  - Always use `colors.shadow` for shadowColor — never hardcode "#000".
 *  - Apply by spreading: `{ ...Elevation[1], shadowColor: colors.shadow }`
 */
import { Platform, ViewStyle } from "react-native";

type ElevationStyle = Pick<ViewStyle, "shadowOpacity" | "shadowOffset" | "shadowRadius" | "elevation">;

/**
 * Elevation presets. Spread into a style object and always pair with
 * `shadowColor: colors.shadow` from `useTheme()`.
 *
 * @example
 * style={{ ...Elevation[1], shadowColor: colors.shadow }}
 */
export const Elevation: Record<0 | 1 | 2 | 3, ElevationStyle> = {
  /** Flat backgrounds — no shadow */
  0: Platform.select({
    ios: { shadowOpacity: 0, shadowOffset: { width: 0, height: 0 }, shadowRadius: 0 },
    default: { elevation: 0 },
  }) as ElevationStyle,

  /** Cards, list items, inputs */
  1: Platform.select({
    ios: { shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3 },
    default: { elevation: 2 },
  }) as ElevationStyle,

  /** Bottom sheet, tab bar, raised sections */
  2: Platform.select({
    ios: { shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
    default: { elevation: 4 },
  }) as ElevationStyle,

  /** FAB, dialogs, toasts */
  3: Platform.select({
    ios: { shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
    default: { elevation: 8 },
  }) as ElevationStyle,
};
