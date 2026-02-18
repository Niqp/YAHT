/**
 * YAHT Design System — Haptics Utility
 *
 * Thin wrapper around expo-haptics as specified in UI_UX_GUIDELINES.md §10.4.
 * Use sparingly — only for meaningful user actions.
 */
import * as Haptics from "expo-haptics";

export const haptic = {
  /**
   * Light impact — completing a habit.
   */
  complete: (): Promise<void> => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /**
   * Success notification — timer auto-complete.
   */
  success: (): Promise<void> => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /**
   * Warning notification — destructive action confirmed.
   */
  warning: (): Promise<void> => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /**
   * Medium impact — general confirmation.
   */
  medium: (): Promise<void> => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
};
