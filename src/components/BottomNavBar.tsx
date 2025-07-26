import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Home2,
  Chart,
  Briefcase,
  User,
} from 'iconsax-react-nativejs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// --- TYPES ---

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}

// --- COLORS ---

const colors = {
  active: '#FFFFFF',
  inactive: '#868686',
  background: '#1F1F1F',
};

// --- STYLES ---



const styles = StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    bottom: 35,
    left: 59,
    right: 59,
    height: 72,
    backgroundColor: colors.background,
    borderRadius: 36,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
});

// --- NAV ITEM COMPONENT ---

const NavItem: React.FC<NavItemProps & { activeColor?: string }> = ({ icon, activeIcon, isActive, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    {isActive ? activeIcon : icon}
  </TouchableOpacity>
);

// --- BOTTOM NAV BAR COMPONENT ---

const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? colors.active : colors.inactive;
    const variant = isFocused ? 'Bold' : 'Linear';

    switch (routeName) {
      case 'Home':
        return <Home2 size={24} color={color} variant={variant as any} />;
      case 'Explore':
        return <Chart size={24} color={color} variant={variant as any} />;
      case 'Journal':
        return <Briefcase size={24} color={color} variant={variant as any} />;
      case 'Goals':
        return <User size={24} color={color} variant={variant as any} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.navBarContainer}>
      {state.routes.map((route, index) => {
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

        return (
          <NavItem
            key={route.key}
            label={route.name}
            icon={getIcon(route.name, false)!}
            activeIcon={getIcon(route.name, true)!}
            isActive={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
};

export default BottomNavBar;
