import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

// Design system colors
const colors = {
  orange50: '#FFF7ED',
  orange400: '#FB923C',
  gray800: '#1F2937',
  white: '#FFFFFF',
  violet100: '#EDE9FE',
  blue700: '#1D4ED8',
};

interface YearlyAccessCardProps {
  onSubscribe: () => void;
  price?: string;
  currency?: string;
  discount?: string;
}

const YearlyAccessCard: React.FC<YearlyAccessCardProps> = ({
  onSubscribe,
  price = '10,000',
  currency = '₦',
  discount = 'Save 45%'
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentSection}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>YEARLY ACCESS</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{discount}</Text>
            </View>
          </View>
          <Text style={styles.priceText}>
            {currency}{price}/year
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.subscribeButtonContainer}
        onPress={onSubscribe}
        activeOpacity={0.8}
      >
        <View style={styles.subscribeButton}>
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: colors.orange50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.orange400,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.orange400,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
        shadowColor: colors.orange400,
      },
    }),
  },
  contentSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    color: colors.gray800,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.violet100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.blue700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    textAlign: 'center',
    color: colors.blue700,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    lineHeight: 16,
  },
  priceText: {
    alignSelf: 'stretch',
    color: colors.gray800,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Larsseit',
    lineHeight: 28,
  },
  subscribeButtonContainer: {
    width: 80,
    backgroundColor: colors.white,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.orange400,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
        shadowColor: colors.orange400,
      },
    }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.orange400,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  subscribeButtonText: {
    color: colors.orange400,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    lineHeight: 20,
  },
});

export default YearlyAccessCard; 