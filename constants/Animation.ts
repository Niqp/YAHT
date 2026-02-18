/**
 * YAHT Design System — Animation & Motion Configs
 *
 * Shared spring and timing configurations as specified in
 * UI_UX_GUIDELINES.md §10.
 * Rules:
 *  - Prefer spring-based animations for natural feel.
 *  - Duration: 150–300ms. Never over 500ms.
 *  - Respect reduced motion via useReducedMotion() from reanimated.
 *  - Animations must never block user input.
 */
import { Easing } from "react-native-reanimated";

/**
 * Spring configs for use with `withSpring(value, SpringConfig.*)`.
 */
export const SpringConfig = {
  /** Button press feedback — 120ms feel */
  buttonPress: {
    damping: 15,
    stiffness: 400,
    mass: 0.8,
  },
  /** FAB press feedback — 200ms feel */
  fabPress: {
    damping: 12,
    stiffness: 300,
    mass: 1,
  },
  /** Sheet / modal open — 300ms spring (damping 0.8 feel) */
  sheetOpen: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
} as const;

/**
 * Timing configs for use with `withTiming(value, TimingConfig.*)`.
 */
export const TimingConfig = {
  /** State change (completed, active) — 250ms ease-out */
  stateChange: {
    duration: 250,
    easing: Easing.out(Easing.quad),
  },
  /** Sheet / modal close — 250ms ease-in */
  sheetClose: {
    duration: 250,
    easing: Easing.in(Easing.quad),
  },
  /** Progress bar fill — 300ms ease-out */
  progressFill: {
    duration: 300,
    easing: Easing.out(Easing.quad),
  },
  /** Item dismiss — 200ms ease-in */
  itemDismiss: {
    duration: 200,
    easing: Easing.in(Easing.quad),
  },
  /** Reduced motion fallback — 100ms for essential animations */
  reducedMotion: {
    duration: 100,
    easing: Easing.linear,
  },
} as const;

/** Scale values for press feedback animations */
export const PressScale = {
  /** Button press target scale */
  button: 0.96,
  /** FAB press target scale */
  fab: 0.92,
} as const;
