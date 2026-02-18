/**
 * YAHT Design System — Spacing & Border Radius Tokens
 *
 * 4pt grid spacing scale and border radius scale as specified in
 * UI_UX_GUIDELINES.md §4 and §7.
 * Rules:
 *  - All padding, margin, and gap values MUST use these tokens.
 *  - No values outside these scales. Round to the nearest token if needed.
 *  - Nested elements use smaller radii than their parent.
 *  - Consistency within groups: all cards of the same type share the same radius.
 */

/** 4pt grid spacing scale (UI_UX_GUIDELINES §4.1) */
export const Spacing = {
  /** 2 — tiny internal gaps */
  xxs: 2,
  /** 4 — icon-to-text tight coupling */
  xs: 4,
  /** 8 — chip padding, gap between stacked items */
  sm: 8,
  /** 12 — list item inner padding, sibling gaps */
  md: 12,
  /** 16 — card horizontal padding, screen margins */
  base: 16,
  /** 20 — card vertical padding, section gaps */
  lg: 20,
  /** 24 — between sections on a page */
  xl: 24,
  /** 32 — major separators, bottom sheet top padding */
  xxl: 32,
  /** 40 — safe-area-aware spacing, bottom scroll padding */
  xxxl: 40,
} as const;

/** Border radius scale (UI_UX_GUIDELINES §7) */
export const BorderRadius = {
  /** 4 — badges, tiny chips, progress bar tracks */
  xs: 4,
  /** 8 — inputs, small buttons, tags */
  sm: 8,
  /** 12 — cards, sections, list containers */
  md: 12,
  /** 16 — modals, standalone pill buttons */
  lg: 16,
  /** 24 — bottom sheet corners, pill-shaped elements */
  xl: 24,
  /** 9999 — FAB, circular icon containers */
  full: 9999,
} as const;

export type SpacingToken = keyof typeof Spacing;
export type BorderRadiusToken = keyof typeof BorderRadius;
