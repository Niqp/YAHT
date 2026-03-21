import React, { memo, useEffect, useMemo, useState } from "react";
import { InteractionManager, StyleProp, View, ViewStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

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
  animateMount?: boolean;
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
  animateMount = true,
}: WheelPickerProps) {
  const { colors } = useTheme();
  const [isReady, setIsReady] = useState(!animateMount);

  useEffect(() => {
    if (animateMount) {
      let task: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;
      const timeoutId = setTimeout(() => {
        task = InteractionManager.runAfterInteractions(() => {
          setIsReady(true);
        });
      }, 350);

      return () => {
        clearTimeout(timeoutId);
        task?.cancel();
      };
    } else {
      setIsReady(true);
    }
  }, [animateMount]);
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

  let content;
  if (virtualized) {
    content = (
      <VirtualizedBaseWheelPicker
        {...commonProps}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        windowSize={windowSize}
        updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      />
    );
  } else {
    content = <BaseWheelPicker {...commonProps} />;
  }

  if (animateMount) {
    if (isReady) {
      return (
        <Animated.View entering={FadeIn.duration(200)} style={style}>
          {content}
        </Animated.View>
      );
    } else {
      return <View style={style} />;
    }
  }

  return content;
}

export default memo(WheelPicker);
