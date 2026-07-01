/**
 * YAHT Design System — Elevation & Shadow Presets
 *
 * Platform-aware shadow styles as specified in UI_UX_GUIDELINES.md §6.
 * Rules:
 *  - Always use `colors.shadow` for shadowColor — never hardcode "#000".
 *  - Apply the function: `style={getElevation(1, colors.shadow)}`
 */
import { Platform } from "react-native";
import type { ViewStyle } from "react-native";

/**
 * Returns platform-aware elevation and shadow styles.
 * On Android, returns `elevation`.
 * On iOS, returns native shadow props.
 *
 * @example
 * style={getElevation(1, colors.shadow)}
 */
export function getElevation(level: 0 | 1 | 2 | 3, shadowColor: string = "rgba(0,0,0,0.3)"): ViewStyle {
  if (Platform.OS !== "ios") {
    switch (level) {
      case 0:
        return { elevation: 0 };
      case 1:
        return { elevation: 2 };
      case 2:
        return { elevation: 4 };
      case 3:
        return { elevation: 8 };
    }
  }

  if (level === 0) {
    return {
      shadowColor: shadowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    };
  }

  const opacities = { 1: 0.06, 2: 0.1, 3: 0.15 } as const;
  const offsets = { 1: 1, 2: 2, 3: 4 } as const;
  const radii = { 1: 3, 2: 6, 3: 10 } as const;

  return {
    shadowColor: shadowColor,
    shadowOffset: { width: 0, height: offsets[level] },
    shadowOpacity: opacities[level],
    shadowRadius: radii[level],
  };
}
