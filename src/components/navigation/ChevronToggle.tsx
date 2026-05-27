import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { IChevronToggleProps } from './types';

const ChevronToggle = ({ isExpanded, onPress }: IChevronToggleProps) => {
  const rotation = useSharedValue(isExpanded ? 90 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 90 : 0, { duration: 300 });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPress={onPress}
      className="w-11 h-11 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel={isExpanded ? 'Collapse section' : 'Expand section'}
    >
      <Animated.View style={animatedStyle}>
        <FontAwesome name="chevron-right" size={14} />
      </Animated.View>
    </Pressable>
  );
};

export { ChevronToggle };
