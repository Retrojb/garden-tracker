import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';

import { useGardens } from '@/src/hooks/useGardens';
import { usePlants } from '@/src/hooks/usePlants';

import { DrawerParentItem } from './DrawerParentItem';
import { DrawerSubItem } from './DrawerSubItem';
import { ExpandableDrawerSection } from './ExpandableDrawerSection';
import type { ExpandedSectionsState } from './types';

const BREAKPOINT = 768;

/**
 * Derives the plant display label with fallback logic:
 * name → species → "Unnamed Plant"
 */
const getPlantLabel = (plant: { name?: string; species?: string }): string =>
  plant.name || plant.species || 'Unnamed Plant';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { navigation, state } = props;
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const { plants, isLoading: plantsLoading } = usePlants();
  const { gardens, isLoading: gardensLoading } = useGardens();

  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    plants: false,
    gardens: false,
  });

  const toggleSection = (key: keyof ExpandedSectionsState) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Derive active route name from drawer navigation state
  const activeRouteName = state.routes[state.index]?.name ?? '';

  // Determine if a parent item is active based on the drawer route name
  const isDashboardActive = activeRouteName === 'index';
  const isPlantsActive = activeRouteName === 'plants' && !pathname.startsWith('/plants/');
  const isGardensActive = activeRouteName === 'gardens' && !pathname.startsWith('/gardens/');
  const isSettingsActive = activeRouteName === 'settings';

  const handleSubItemPress = (routePath: string) => {
    router.push(routePath as never);
    // Close drawer on non-permanent (mobile) layout
    if (width <= BREAKPOINT) {
      navigation.closeDrawer();
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerParentItem
        label="Dashboard"
        icon="home"
        isActive={isDashboardActive}
        onPress={() => navigation.navigate('index')}
      />

      <ExpandableDrawerSection
        label="Plants"
        icon="leaf"
        isExpanded={expandedSections.plants}
        isActive={isPlantsActive}
        onToggle={() => toggleSection('plants')}
        onLabelPress={() => navigation.navigate('plants')}
      >
        {plantsLoading ? (
          <View className="py-3 items-center">
            <ActivityIndicator size="small" />
          </View>
        ) : plants.length === 0 ? (
          <View className="py-3 px-10">
            <Text className="text-sm text-gray-500">No plants yet</Text>
          </View>
        ) : (
          plants.map((plant) => {
            const routePath = `/plants/${plant.id}`;
            return (
              <DrawerSubItem
                key={plant.id}
                label={getPlantLabel(plant)}
                routePath={routePath}
                isActive={pathname === routePath}
                onPress={() => handleSubItemPress(routePath)}
              />
            );
          })
        )}
      </ExpandableDrawerSection>

      <ExpandableDrawerSection
        label="Gardens"
        icon="tree"
        isExpanded={expandedSections.gardens}
        isActive={isGardensActive}
        onToggle={() => toggleSection('gardens')}
        onLabelPress={() => navigation.navigate('gardens')}
      >
        {gardensLoading ? (
          <View className="py-3 items-center">
            <ActivityIndicator size="small" />
          </View>
        ) : gardens.length === 0 ? (
          <View className="py-3 px-10">
            <Text className="text-sm text-gray-500">No gardens yet</Text>
          </View>
        ) : (
          gardens.map((garden) => {
            const routePath = `/gardens/${garden.id}`;
            return (
              <DrawerSubItem
                key={garden.id}
                label={garden.name}
                routePath={routePath}
                isActive={pathname === routePath}
                onPress={() => handleSubItemPress(routePath)}
              />
            );
          })
        )}
      </ExpandableDrawerSection>

      <DrawerParentItem
        label="Settings"
        icon="cog"
        isActive={isSettingsActive}
        onPress={() => navigation.navigate('settings')}
      />
    </DrawerContentScrollView>
  );
};

export { CustomDrawerContent };
