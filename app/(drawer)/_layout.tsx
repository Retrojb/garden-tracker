import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions } from 'react-native';

const BREAKPOINT = 768;

const DrawerLayout = (): React.ReactElement => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > BREAKPOINT;

  return (
    <Drawer
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
