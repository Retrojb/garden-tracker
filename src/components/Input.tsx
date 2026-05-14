import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { tv } from 'tailwind-variants';

const inputStyles = tv({
    slots: {
        base: 'flex flex-col py-2',
        inputLabelContainer: 'flex flex-row',
        inputContainer: 'flex'
    }
});

// TODO: Add schema validation for any type of input (text, password)
interface IInputProps extends TextInput {
    label: string;
    isRequired?: boolean;
    children?: React.ReactElement;
}

const Input = ({label, children, ...props}: IInputProps) => {
    const { base, inputContainer, inputLabelContainer } = inputStyles();
    return (
        <View className={base()}>
            {label && (
                <View className={inputLabelContainer()}>
                    <Text>{label}</Text>
                </View>
            )}
            <View className={inputContainer()}>
                <TextInput></TextInput>
            </View>
        </View>
    )
}