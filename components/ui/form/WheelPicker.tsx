import React, { memo, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { BorderRadius } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import BaseWheelPicker, { withVirtualized } from "@quidone/react-native-wheel-picker";
import { type PickerItem } from "@quidone/react-native-wheel-picker";

const VirtualizedBaseWheelPicker = withVirtualized(BaseWheelPicker);

interface WheelPickerProps {
  data: ReadonlyArray<PickerItem<number>>;
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
}

function WheelPicker({
  data,
  value,
  onChange,
  style,
  itemHeight = 40,
  visibleItemCount = 3,
  virtualized = false,
  initialNumToRender,
  maxToRenderPerBatch,
  windowSize,
  updateCellsBatchingPeriod,
}: WheelPickerProps) {
  const { colors } = useTheme();
  const overlayItemStyle = useMemo(
    () => ({ backgroundColor: colors.primarySubtle, borderRadius: BorderRadius.md }),
    [colors.primarySubtle]
  );
  const itemTextStyle = useMemo(() => ({ color: colors.text, fontSize: 18 }), [colors.text]);
  const commonProps = {
    data,
    value,
    onValueChanged: ({ item }: { item: PickerItem<number> }) => onChange(item.value),
    style,
    itemHeight,
    visibleItemCount,
    itemTextStyle,
    overlayItemStyle,
    enableScrollByTapOnItem: true,
  } as const;

  if (virtualized) {
    return (
      <VirtualizedBaseWheelPicker
        {...commonProps}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        windowSize={windowSize}
        updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      />
    );
  }

  return <BaseWheelPicker {...commonProps} />;
}

export default memo(WheelPicker);
