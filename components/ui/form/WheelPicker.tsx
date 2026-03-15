import React, { memo, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { BorderRadius } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import BaseWheelPicker from "@quidone/react-native-wheel-picker";
import { type PickerItem } from "@quidone/react-native-wheel-picker";

interface WheelPickerProps {
  data: ReadonlyArray<PickerItem<number>>;
  value: number;
  onChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  itemHeight?: number;
  visibleItemCount?: number;
}

function WheelPicker({
  data,
  value,
  onChange,
  style,
  itemHeight = 40,
  visibleItemCount = 3,
}: WheelPickerProps) {
  const { colors } = useTheme();
  const overlayItemStyle = useMemo(
    () => ({ backgroundColor: colors.primarySubtle, borderRadius: BorderRadius.md }),
    [colors.primarySubtle]
  );
  const itemTextStyle = useMemo(() => ({ color: colors.text, fontSize: 18 }), [colors.text]);

  return (
    <BaseWheelPicker
      data={data}
      value={value}
      onValueChanged={({ item }) => onChange(item.value)}
      style={style}
      itemHeight={itemHeight}
      visibleItemCount={visibleItemCount}
      itemTextStyle={itemTextStyle}
      overlayItemStyle={overlayItemStyle}
      enableScrollByTapOnItem
    />
  );
}

export default memo(WheelPicker);
