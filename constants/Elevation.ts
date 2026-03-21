/**
 * YAHT Design System — Elevation & Shadow Presets
 *
 * Platform-aware shadow styles as specified in UI_UX_GUIDELINES.md §6.
 * Rules:
 *  - Always use `colors.shadow` for shadowColor — never hardcode "#000".
 *  - Apply the function: `style={getElevation(1, colors.shadow)}`
 */
import { Platform, ViewStyle } from "react-native";

/**
 * Returns platform-aware elevation and shadow styles.
 * On Android, returns `elevation`.
 * On iOS, returns `boxShadow` combining the level's opacity with the base shadow color.
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
    return { boxShadow: "0px 0px 0px 0px transparent" } as ViewStyle;
  }

  const opacities = { 1: 0.06, 2: 0.1, 3: 0.15 } as const;
  const offsets = { 1: "0px 1px 3px", 2: "0px 2px 6px", 3: "0px 4px 10px" } as const;

  let color = shadowColor;
  const match = shadowColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);

  if (match) {
    const r = match[1];
    const g = match[2];
    const b = match[3];
    const baseAlpha = parseFloat(match[4]);
    // The old system effectively stacked opacities (alpha * shadowOpacity)
    const finalAlpha = Math.min(1, baseAlpha * opacities[level]);
    color = `rgba(${r}, ${g}, ${b}, ${finalAlpha.toFixed(3)})`;
  }

  return { boxShadow: `${offsets[level]} 0px ${color}` } as ViewStyle;
}
