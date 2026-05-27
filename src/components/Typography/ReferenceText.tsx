import { Text, View } from 'react-native';
import { tv } from 'tailwind-variants';
import { TTypography } from './types';

const style = tv({});
const  ReferenceText = ({ children }: TTypography) => {
    const {} = style()
    return (
        <View>
            <Text>{children}</Text>
        </View>
    )
}

export { ReferenceText };
