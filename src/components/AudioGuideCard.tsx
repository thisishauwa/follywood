import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Music } from 'iconsax-react-nativejs';
import { LinearGradient } from 'expo-linear-gradient';

interface AudioGuideCardProps {
  title: string;
  description?: string;
  duration?: string; // e.g. "5 min"
  thumbnailUrl?: string;
  onPress?: () => void;
  variant?: 'default' | 'horizontal';
  isPlaying?: boolean;
}

const colors = {
  gray800: '#242B33',
  gray700: '#495766',
  gray500: '#A1AEBC',
  gray300: '#D7DCE2',
  gray100: '#F2F3F5',
  gray50: '#F7F8F9',
  white: '#FFFFFF',
  ttaBlue: '#7a98ec',
  gradientStart: '#a6bbf3',
  gradientEnd: '#fdefec',
};

const AudioGuideCard: React.FC<AudioGuideCardProps> = ({
  title,
  description,
  duration,
  thumbnailUrl,
  onPress,
  variant = 'default',
  isPlaying = false,
}) => {
  const isHorizontal = variant === 'horizontal';
  
  const renderThumbnail = () => {
    if (thumbnailUrl) {
      return (
        <Image 
          source={{ uri: thumbnailUrl }} 
          style={[styles.thumbnail, isHorizontal && styles.horizontalThumbnail]} 
        />
      );
    } else if (isHorizontal) {
      // For You section cards (horizontal) use gradient
      return (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={[styles.thumbnailPlaceholder, styles.horizontalThumbnail]}
        >
          <Music size={48} color={colors.white} />
        </LinearGradient>
      );
    } else {
      // Default cards use solid blue background
      return (
        <View style={styles.thumbnailPlaceholder}>
          <Music size={24} color={colors.white} />
        </View>
      );
    }
  };

  return (
  <TouchableOpacity
      style={[
        styles.card, 
        isHorizontal && styles.horizontalCard,
        isPlaying && styles.playingCard
      ]}
    activeOpacity={0.8}
    onPress={onPress}
    disabled={!onPress}
  >
      {renderThumbnail()}

      <View style={[styles.textContainer, isHorizontal && styles.horizontalTextContainer]}>
      <Text 
          style={[styles.title, isHorizontal && styles.horizontalTitle]} 
        numberOfLines={2}
      >
        {title}
      </Text>
      {!!description && (
        <Text 
              style={[styles.description, isHorizontal && styles.horizontalDescription]}
              numberOfLines={isHorizontal ? 3 : 2}
        >
          {description}
        </Text>
      )}
          {!!duration && <Text style={[styles.duration, isHorizontal && styles.horizontalDuration]}>{duration}</Text>}
    </View>
  </TouchableOpacity>
);
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  horizontalCard: {
    width: 240,
    flexDirection: 'column',
    marginRight: 12,
    padding: 0,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  playingCard: {
    borderWidth: 1,
    borderColor: '#D3DDF9',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  horizontalThumbnail: {
    width: '100%',
    height: 160,
    marginBottom: 12,
    borderRadius: 0,
    marginRight: 0,
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.ttaBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  horizontalTextContainer: {
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    lineHeight: 22,
  },
  horizontalTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Larsseit',
    color: colors.gray500,
    marginTop: 4,
  },
  horizontalDescription: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: colors.gray700,
    lineHeight: 20,
    flexShrink: 1,
  },
  duration: {
    fontSize: 12,
    color: '#BE6BC6',
    marginTop: 8,
    fontFamily: 'Larsseit',
  },
  horizontalDuration: {
    marginTop: 'auto',
    paddingTop: 8,
  },
});

export default AudioGuideCard;
