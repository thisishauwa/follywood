import Slider from '@react-native-community/slider';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Link21, Pause, Play } from 'iconsax-react-nativejs';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { AudioGuide } from '../services/supabase';
import useAudioPlayerStore from '../stores/audioPlayerStore';

type RouteParams = {
  AudioGuides: {
    guideId: string;
    title: string;
    audioUrl?: string;
    thumbnailUrl?: string;
    description?: string;
    lastPosition?: number;
  };
};

const formatTime = (millis: number) => {
  if (isNaN(millis)) return '0:00';
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

const AudioGuidesScreen = () => {
  const backgroundImage = require('../../assets/images/Backgroundforaudio.png');
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'AudioGuides'>>();
  const params = route.params;
  const { user } = useAuth();

  const {
    loadSound,
    handlePlayPause,
    seek,
    currentTrack,
    isPlaying,
    isLoading,
    playbackStatus,
  } = useAudioPlayerStore();

  // Fetch audio guide data if only guideId is provided (from deep link)
  const [isLoadingGuideData, setIsLoadingGuideData] = useState(false);
  const [guideData, setGuideData] = useState<AudioGuide | null>(null);

  useEffect(() => {
    // If we only have guideId but no other data (from deep link), fetch the guide data
    const fetchGuideData = async () => {
      if (params.guideId && !params.title) {
        setIsLoadingGuideData(true);
        try {
          // Import the service to fetch audio guide data
          const { getAudioGuideById } = require('../services/audioGuideService');
          const guide = await getAudioGuideById(params.guideId);
          if (guide) {
            setGuideData(guide);
          }
        } catch (error) {
          console.error('Error fetching audio guide data:', error);
        } finally {
          setIsLoadingGuideData(false);
        }
      }
    };

    fetchGuideData();
  }, [params.guideId]);

  useEffect(() => {
    // Create track object from either params or fetched guide data
    const trackFromParams: AudioGuide = guideData || {
      id: params.guideId,
      title: params.title || 'Loading...',
      description: params.description || '',
      file_path: params.audioUrl || '',
      thumbnail_url: params.thumbnailUrl || '',
      duration: 0, // Dummy value, not used in player
      category: null, // Dummy value, not used in player
      created_at: new Date().toISOString(), // Dummy value, not used in player
    };

    // Only load sound if we have enough data or if the guide data has been fetched
    if ((trackFromParams.title !== 'Loading...' || guideData) && 
        trackFromParams.id !== currentTrack?.id) {
      loadSound(trackFromParams, params.lastPosition, user?.id);
    }
  }, [params.guideId, params.title, guideData, user?.id]);

  const onSliderValueChange = (value: number) => {
    seek(value);
  };



  const onShare = async () => {
    try {
      // Use the app's URL scheme for deep linking to this specific audio guide
      const deepLinkUrl = `talktoaugust://audio/${params.guideId}`;
      
      // Get the app's display name from app.json for a more professional message
      const appName = "Talk to August";
      
      await Share.share({
        title: `Listen to: ${displayTitle}`,
        message: `I'm listening to "${displayTitle}" on ${appName}. Open the app to listen!`,
        url: deepLinkUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const isCurrentTrackOnScreen = currentTrack?.id === params.guideId;
  const displayTitle = isCurrentTrackOnScreen ? currentTrack.title : (guideData?.title || params.title || 'Loading...');
  const displayDescription = isCurrentTrackOnScreen ? currentTrack.description : (guideData?.description || params.description || '');
  const displayThumbnailUrl = isCurrentTrackOnScreen ? currentTrack.thumbnail_url : (guideData?.thumbnail_url || params.thumbnailUrl || '');

  const currentPosition = playbackStatus?.positionMillis || 0;
  const duration = playbackStatus?.durationMillis || 0;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={backgroundImage} style={{ flex: 1 }} resizeMode="cover">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <ArrowLeft size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare} style={styles.headerButton}>
              <Link21 size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.trackInfoContainer}>
              <Text style={styles.title}>{displayTitle || 'Audio Guide'}</Text>
              <Text style={styles.description}>{displayDescription || ''}</Text>
            </View>

            <View style={styles.playerControlsContainer}>
              <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <View style={styles.playPauseIconContainer}>
                    {isPlaying ? (
                      <Pause size={44} color="#2154E0" />
                    ) : (
                      <Play size={44} color="#2154E0" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={duration > 0 ? currentPosition / duration : 0}
                onSlidingComplete={onSliderValueChange}
                minimumTrackTintColor="#f19ef9"
                maximumTrackTintColor="#580560"
                thumbTintColor="#FFFFFF"
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  trackInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: '25%',
  },
  title: {
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Larsseit-Bold',
  },
  description: {
    fontSize: 18,
    color: '#B0B0D0',
    textAlign: 'center',
    fontFamily: 'Larsseit',
  },
  playerControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: '20%',
  },
  playPauseButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Larsseit',
  },
});

export default AudioGuidesScreen;
