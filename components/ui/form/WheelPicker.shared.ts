import { Platform, StyleProp, ViewStyle } from "react-native";

export interface WheelPickerItem {
  value: number;
  label: string;
}

export interface WheelPickerProps {
  data: ReadonlyArray<WheelPickerItem>;
  value: number;
  onChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  itemHeight?: number;
  visibleItemCount?: number;
  virtualized?: boolean;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  updateCellsBatchingPeriod?: number;
  animateMount?: boolean;
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
