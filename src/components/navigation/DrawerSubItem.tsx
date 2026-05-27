import React from 'react';
import { Pressable, Text } from 'react-native';
import { tv } from 'tailwind-variants';

import type { IDrawerSubItemProps } from './types';

const drawerSubItem = tv({
  slots: {
    container: 'pl-10 py-2 rounded-md mx-2',
    label: 'text-sm',
  },
  variants: {
    isActive: {
      true: {
        container: 'bg-green-100',
        label: 'text-green-800 font-semibold',
      },
      false: {
        container: '',
        label: 'text-gray-700',
      },
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

const DrawerSubItem = ({ label, isActive, onPress }: IDrawerSubItemProps) => {
  const { container, label: labelStyle } = drawerSubItem({ isActive });

  return (
    <Pressable onPress={onPress} className={container()}>
      <Text className={labelStyle()}>{label}</Text>
    </Pressable>
  );
};

export { DrawerSubItem };
