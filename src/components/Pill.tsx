import React from 'react';
import { Text, View } from 'react-native';
import { tv } from 'tailwind-variants';

const pillStyles = tv({
    slots: {
        base: 'flex flex-col p-4 bg-green-600',
    }
});

// TODO: Add schema validation for any type of input (text, password)
interface IInputProps extends View {
    text: string;
    children?: React.ReactElement;
}

const Input = ({text, children, ...props}: IInputProps) => {
    const { base } = pillStyles();
    return (
        <View className={base()}>
            <Text className='color-white'>{text}</Text>
        </View>
    )
}