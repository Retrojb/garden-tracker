import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions } from 'react-native';

import { CustomDrawerContent } from '@/src/components/navigation/CustomDrawerContent';
import { useAuth } from '@/src/features/auth/AuthContext';

const BREAKPOINT = 768;

const DrawerLayout = (): React.ReactElement => {
  const { status } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > BREAKPOINT;

  // Redirect unauthenticated users to sign-in
  if (status === 'unauthenticated') {
    return <Redirect href={'/(auth)/sign-in' as never} />;
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: isLargeScreen ? 'permanent' : 'front',
        drawerStyle: {
          width: 240,
        },
        headerShown: !isLargeScreen,
        headerLeft: !isLargeScreen ? undefined : () => null,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }) => (
            <FontAwesome name="home" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="plants"
        options={{
          title: 'Plants',
          drawerIcon: ({ color }) => (
            <FontAwesome name="leaf" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="gardens"
        options={{
          title: 'Gardens',
          drawerIcon: ({ color }) => (
            <FontAwesome name="tree" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => (
            <FontAwesome name="cog" size={20} color={color} />
          ),
        }}
      />
    </Drawer>
  );
};

export { DrawerLayout as default };
