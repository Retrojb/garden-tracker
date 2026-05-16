import React from 'react';
import { Platform, Text, View } from 'react-native';
import { tv } from 'tailwind-variants';
import { Avatar } from '../Avatar';

const header = tv({
    slots: {
        base: 'flex flex-row md:min-h-[120px] bg-white',
        title: 'text-6xl',
        titleContainer: 'flex-1'
    }
})

const Header = () => {
      if (Platform.OS !== 'web') return null;
    const { base, title, titleContainer} = header();
    return (
        <View className={base()}>
            <View className={titleContainer()}>
                <Text className={title()}>Header</Text>
            </View>
            <View>
                <Avatar initials='JB' size='md' onPress={() => alert('Hello')}/>
            </View>
        </View>
    );
}

export default Header;