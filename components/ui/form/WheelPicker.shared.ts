import { Platform, StyleProp, ViewStyle } from "react-native";

export interface WheelPickerProps {
  /** Domain values only — labels are produced lazily per rendered row via formatLabel. */
  values: ReadonlyArray<number>;
  /** Localized label for a value. Defaults to String(value). Called only for visible rows on Android. */
  formatLabel?: (value: number) => string;
  value: number;
  onChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  itemHeight?: number;
  visibleItemCount?: number;
}

export const DEFAULT_WHEEL_PICKER_HEIGHT = 120;
export const DEFAULT_WHEEL_PICKER_CARD_HEIGHT = 164;
export const DEFAULT_WHEEL_PICKER_PANEL_HEIGHT = 288;

export const IOS_NATIVE_PICKER_HEIGHT = 216;
export const IOS_NATIVE_PICKER_CARD_HEIGHT = 252;
export const IOS_NATIVE_PICKER_PANEL_HEIGHT = 336;

export const WHEEL_PICKER_HEIGHT = Platform.OS === "ios" ? IOS_NATIVE_PICKER_HEIGHT : DEFAULT_WHEEL_PICKER_HEIGHT;
export const WHEEL_PICKER_CARD_HEIGHT =
  Platform.OS === "ios" ? IOS_NATIVE_PICKER_CARD_HEIGHT : DEFAULT_WHEEL_PICKER_CARD_HEIGHT;
export const WHEEL_PICKER_PANEL_HEIGHT =
  Platform.OS === "ios" ? IOS_NATIVE_PICKER_PANEL_HEIGHT : DEFAULT_WHEEL_PICKER_PANEL_HEIGHT;
