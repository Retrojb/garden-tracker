import { Text, View } from 'react-native';
import { TTypography } from './types';

const  Paragraph = ({ children }: TTypography) => {
    return (
        <View>
            <Text className='text-md'>{children}</Text>
        </View>
    )
}

export { Paragraph };
