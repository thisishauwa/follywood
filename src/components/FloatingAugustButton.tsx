import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Messages2 } from 'iconsax-react-nativejs';

const FloatingAugustButton = () => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Chat' as never);
  };

  return (
    <TouchableOpacity 
      style={styles.floatingButton}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Messages2 size="20" color="#ffffff" style={styles.icon} />
      <Text style={styles.buttonText}>Talk to August</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10000, // Very large radius for pill shape
    backgroundColor: '#2154E0',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8, // Space between icon and text
    paddingLeft: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  buttonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Larsseit',
    fontWeight: '500',
    lineHeight: 20,
  },
  icon: {
    marginRight: 2,
  },
});

export default FloatingAugustButton;
