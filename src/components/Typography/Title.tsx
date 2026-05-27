import { Text, View } from 'react-native';
import { tv } from 'tailwind-variants';
import { TTypography } from './types';

const style = tv({});
const  Title = ({ children }: TTypography) => {
    return (
        <View>
            <Text>{children}</Text>
        </View>
    )
}

export { Title };
