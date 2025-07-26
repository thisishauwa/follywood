import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Home2,
  SearchNormal,
  Book,
  MedalStar,
} from 'iconsax-react-nativejs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  gray500: '#6B7280',
  home: '#2154E0',
  explore: '#F09235',
  journal: '#F19EF9',
  goals: '#57BD8B',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
  gray900: '#111827',
};

// --- STYLES ---



const styles = StyleSheet.create({
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
    fontFamily: 'Larsseit',
  },
  // We'll set color dynamically, so remove color here
  activeNavText: {
    fontWeight: '600',
  },
});

// --- NAV ITEM COMPONENT ---

const NavItem: React.FC<NavItemProps & { activeColor?: string }> = ({ label, icon, activeIcon, isActive, onPress, activeColor }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    {isActive ? activeIcon : icon}
    <Text style={[styles.navText, isActive && { color: activeColor }, isActive && styles.activeNavText]}>{label}</Text>
  </TouchableOpacity>
);

// --- BOTTOM NAV BAR COMPONENT ---

const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const navItems = ["Home", "Explore", "Add", "Journal", "Goals"];
  const getActiveColor = (routeName: string) => {
    switch (routeName) {
      case 'Home': return colors.home;
      case 'Explore': return colors.explore;
      case 'Journal': return colors.journal;
      case 'Goals': return colors.goals;
      default: return colors.gray500;
    }
  };

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? getActiveColor(routeName) : colors.gray500;
    const variant = isFocused ? 'Bold' : 'Linear';

    switch (routeName) {
      case 'Home':
        return <Home2 size={24} color={color} variant={variant as any} />;
      case 'Explore':
        return <SearchNormal size={24} color={color} variant={variant as any} />;
      case 'Journal':
        return <Book size={24} color={color} variant={variant as any} />;
      case 'Goals':
        return <MedalStar size={24} color={color} variant={variant as any} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.navBarContainer, { paddingBottom: insets.bottom || 8 }]}>
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

        const activeColor = getActiveColor(route.name);
        return (
          <NavItem
            key={route.key}
            label={route.name}
            icon={getIcon(route.name, false)!}
            activeIcon={getIcon(route.name, true)!}
            isActive={isFocused}
            onPress={onPress}
            activeColor={activeColor}
          />
        );
      })}
    </View>
  );
};

export default BottomNavBar;
