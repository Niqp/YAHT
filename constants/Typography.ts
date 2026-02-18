/**
 * YAHT Design System — Typography Scale
 *
 * 9-level type scale as specified in UI_UX_GUIDELINES.md §3.
 * Rules:
 *  - System font only (San Francisco on iOS, Roboto on Android). No custom fonts.
 *  - Max two font weights per visual section.
 *  - Never use ALL CAPS for body text.
 *  - Changing numbers (timers, counters) must use fontVariant: ["tabular-nums"].
 */
import { StyleSheet, TextStyle } from "react-native";

export const Typography = StyleSheet.create<Record<string, TextStyle>>({
  /** Hero numbers — stats, large timer readout */
  display: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  /** Screen titles */
  heading: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  /** Section headers, card titles */
  title: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  /** Default text, item names */
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
  },
  /** Emphasized text, button labels */
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  /** Input labels, metadata */
  label: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  /** Subtitles, secondary info */
  caption: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  /** Chips, tab labels, timestamps */
  small: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  /** Badge counts, tertiary metadata */
  tiny: {
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 14,
  },
});

export type TypographyVariant = keyof typeof Typography;
