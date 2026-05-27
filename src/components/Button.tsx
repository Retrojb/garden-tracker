import React from 'react';
import { Pressable, Text } from 'react-native';
import { tv } from 'tailwind-variants';

interface IButtonProps extends React.ComponentProps<typeof Pressable> {
    label: string;
    variant?: string
}

const button = tv({
  base: 'font-semibold rounded-lg px-4 py-2',
  variants: {
    color: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white',
      danger: 'bg-red-500 text-white',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    disabled: {
      true: 'opacity-50 bg-gray-500 pointer-events-none'
    }
  },
  compoundVariants: [
    {
      color: 'primary',
      size: 'lg',
      class: 'bg-blue-600',
    },
  ],
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
});

const Button = ({label}: IButtonProps) => {
    return(
        <Pressable className={button({ color: 'primary', size: 'lg' })}>
            <Text>{label}</Text>
        </Pressable>
        )
}

export { Button };
