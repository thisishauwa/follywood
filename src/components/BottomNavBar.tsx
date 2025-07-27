import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Discover, Shop, User } from 'iconsax-react-native';

interface BottomNavBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const icons: { [key: string]: any } = {
    Home: Home,
    Explore: Discover,
    Shop: Shop,
    Studios: User,
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

        // Hide production flow screens from tab bar
        if (['BeginProduction', 'CastSelection', 'DirectorSelection', 'ProductionBudget'].includes(route.name)) {
          return null;
        }

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const IconComponent = icons[route.name];

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            {IconComponent && (
              <IconComponent
                size={24}
                color={isFocused ? '#EE4C01' : '#8C8C8C'}
                variant={isFocused ? 'Bold' : 'Outline'}
              />
            )}
            <Text style={[styles.label, { color: isFocused ? '#EE4C01' : '#8C8C8C' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: 'BuenosAires-Medium',
  },
});

export default BottomNavBar;
