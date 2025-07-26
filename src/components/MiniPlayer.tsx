import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { PlayCircle, PauseCircle, Music, CloseCircle } from 'iconsax-react-nativejs';
import { LinearGradient } from 'expo-linear-gradient';
import useAudioPlayerStore from '../stores/audioPlayerStore';
import { AppStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { AudioProgressTracker } from '../services/audioProgressTracker';

const MiniPlayer = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const { currentTrack, isPlaying, handlePlayPause, closePlayer } = useAudioPlayerStore();
  const { user } = useAuth();

  // Set user for progress tracking when user changes
  useEffect(() => {
    AudioProgressTracker.setUser(user?.id || null);
  }, [user?.id]);

  if (!currentTrack) {
    return null;
  }

  const navigateToPlayer = () => {
    if (!currentTrack) return;
    navigation.navigate('AudioGuides', {
      guideId: currentTrack.id,
      title: currentTrack.title,
      audioUrl: currentTrack.file_path,
      thumbnailUrl: currentTrack.thumbnail_url,
      description: currentTrack.description,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={navigateToPlayer} style={styles.touchableArea}>
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={['#a6bbf3', '#fdefec']}
            style={styles.thumbnail}
          >
            <Music size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Playing now</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}>
        {isPlaying ? <PauseCircle size={34} color="#2154E0" variant="Bulk" /> : <PlayCircle size={34} color="#2154E0" variant="Bulk" />}
      </TouchableOpacity>
      <TouchableOpacity onPress={closePlayer} style={styles.closeButton}>
        <CloseCircle size={22} color="#AAAAAA" variant="Bulk" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Adjust this based on your tab bar height
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  touchableArea: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 50,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Larsseit-Bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Larsseit',
  },
  playPauseButton: {
    position: 'absolute',
    right: 40,
    padding: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
});

export default MiniPlayer;
