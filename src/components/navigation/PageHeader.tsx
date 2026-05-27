import { useUser } from '@/src/hooks/useUser';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { tv } from 'tailwind-variants';
import { Avatar } from '../Avatar';
import Seperator from '../Seperator';

const header = tv({
    slots: {
        base: 'flex flex-col md:min-h-[120px] bg-mist-500 px-12 py-4 gap-8',
        container: 'flex flex-row items-center ',
        title: 'text-6xl',
        titleContainer: 'flex-1'
    }
})

const Header = () => {
    if (Platform.OS !== 'web') return null;
    const router = useRouter();
    const { user } = useUser()

    const { base, container, title, titleContainer } = header();
    return (
        <View className={base()}>
            <View className={container()}>
                <View className={titleContainer()}>
                    <Text className={title()}>Header</Text>
                </View>
                <View>
                    <Avatar
                        initials='JB'
                        size='md'
                        onPress={() => router.replace('/settings')}
                        src={user.avatarUri ?? undefined}
                    />
                </View>
            </View>
            <Seperator />
        </View>
    );
}

export default Header;