import React, { useEffect } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { IAnimatedSubItemListProps } from './types';

const AnimatedSubItemList = ({ isExpanded, children }: IAnimatedSubItemListProps) => {
  const contentHeight = useSharedValue(0);
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withTiming(isExpanded ? contentHeight.value : 0, { duration: 300 });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    contentHeight.value = event.nativeEvent.layout.height;
  };

  return (
    <Animated.View style={animatedStyle}>
      <View onLayout={onLayout} style={{ position: 'absolute', width: '100%' }}>
        {children}
      </View>
    </Animated.View>
  );
};

export { AnimatedSubItemList };
