import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { tv } from 'tailwind-variants';

import type { IDrawerParentItemProps } from './types';

const drawerParentItem = tv({
  slots: {
    container: 'flex-row items-center px-4 py-3 rounded-md mx-2',
    icon: 'mr-3',
    label: 'text-base',
  },
  variants: {
    isActive: {
      true: {
        container: 'bg-green-100',
        icon: 'text-green-800',
        label: 'text-green-800 font-semibold',
      },
      false: {
        container: '',
        icon: 'text-gray-600',
        label: 'text-gray-700',
      },
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

const DrawerParentItem = ({ label, icon, isActive, onPress }: IDrawerParentItemProps) => {
  const { container, icon: iconStyle, label: labelStyle } = drawerParentItem({ isActive });

  return (
    <Pressable onPress={onPress} className={container()}>
      <View className={iconStyle()}>
        <FontAwesome
          name={icon as React.ComponentProps<typeof FontAwesome>['name']}
          size={20}
        />
      </View>
      <Text className={labelStyle()}>{label}</Text>
    </Pressable>
  );
};

export { DrawerParentItem };
