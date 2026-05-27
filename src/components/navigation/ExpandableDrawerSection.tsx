import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { tv } from 'tailwind-variants';

import { AnimatedSubItemList } from './AnimatedSubItemList';
import { ChevronToggle } from './ChevronToggle';
import type { IExpandableDrawerSectionProps } from './types';

const expandableSection = tv({
  slots: {
    container: 'mx-2',
    labelArea: 'flex-1 flex-row items-center px-4 py-3 rounded-md',
    icon: 'mr-3',
    label: 'text-base',
    row: 'flex-row items-center',
  },
  variants: {
    isActive: {
      true: {
        labelArea: 'bg-green-100',
        icon: 'text-green-800',
        label: 'text-green-800 font-semibold',
      },
      false: {
        labelArea: '',
        icon: 'text-gray-600',
        label: 'text-gray-700',
      },
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

const ExpandableDrawerSection = ({
  label,
  icon,
  isExpanded,
  isActive,
  onToggle,
  onLabelPress,
  children,
}: IExpandableDrawerSectionProps) => {
  const {
    container,
    labelArea,
    icon: iconStyle,
    label: labelStyle,
    row,
  } = expandableSection({ isActive });

  return (
    <View className={container()}>
      <View className={row()}>
        <Pressable onPress={onLabelPress} className={labelArea()}>
          <View className={iconStyle()}>
            <FontAwesome
              name={icon as React.ComponentProps<typeof FontAwesome>['name']}
              size={20}
            />
          </View>
          <Text className={labelStyle()}>{label}</Text>
        </Pressable>
        <ChevronToggle isExpanded={isExpanded} onPress={onToggle} />
      </View>
      <AnimatedSubItemList isExpanded={isExpanded}>
        {children}
      </AnimatedSubItemList>
    </View>
  );
};

export { ExpandableDrawerSection };
