import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AudioGuideCard from "../components/AudioGuideCard";
import { supabase } from "../services/supabase";
import { AudioGuide } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import useAudioPlayerStore from "../stores/audioPlayerStore";
import PaywallModal from "../components/PaywallModal";

type RootStackParamList = {
  AudioGuides: {
    guideId: string;
    title: string;
    audioUrl?: string;
    thumbnailUrl?: string;
    description?: string;
    lastPosition?: number;
  };
  // Add other screen params as needed
};

type NavigationProps = NavigationProp<RootStackParamList>;

// Define interface for audio guide progress
interface AudioGuideProgress {
  id: string;
  user_id: string;
  audio_guide_id: string;
  completed: boolean;
  last_position?: number;
  listen_count: number;
  first_listened_at: string;
  last_updated: string;
}

// Extend AudioGuide to include progress information
interface AudioGuideWithProgress extends AudioGuide {
  progress?: AudioGuideProgress;
  formattedDuration: string;
}

// Interface for user onboarding selections
interface OnboardingSelection {
  user_id: string;
  goal_preference: "teach_me" | "improve_sex" | "enhance_sex";
}

const ExploreScreen = () => {
  const { user, isSubscribed } = useAuth();
  const navigation = useNavigation<NavigationProps>();
  const { currentTrack } = useAudioPlayerStore();
  const [audioGuides, setAudioGuides] = useState<AudioGuideWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  // Format seconds to minutes display (e.g. "5 min")
  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  // Map goal preference to audio guide category
  const mapGoalToCategory = (goalPreference: string): string => {
    switch (goalPreference) {
      case "enhance_sex":
        return "enhance_intimacy";
      case "improve_sex":
        return "improve_communication";
      case "teach_me":
        return "explore_sexuality";
      default:
        return "";
    }
  };

  // Fetch audio guides, user progress, and user goals
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all audio guides
        const { data: guidesData, error: guidesError } = await supabase
          .from("audio_guides")
          .select("*")
          .order("created_at", { ascending: false });

        if (guidesError) throw guidesError;

        let progressData: AudioGuideProgress[] = [];
        let userGoalPreference: string | null = null;

        // If user is logged in, fetch their progress and goal preference
        if (user) {
          const [progressResult, selectionResult] = await Promise.all([
            supabase
              .from("audio_guide_progress")
              .select("*")
              .eq("user_id", user.id),
            supabase
              .from("onboarding_selections")
              .select("goal_preference")
              .eq("user_id", user.id)
              .single(),
          ]);

          if (progressResult.error) throw progressResult.error;
          progressData = progressResult.data || [];

          // Store user's goal preference if available
          if (!selectionResult.error && selectionResult.data) {
            userGoalPreference = selectionResult.data.goal_preference;
            setUserGoal(userGoalPreference);
          }
        }

        // Combine guides with progress information
        const guidesWithProgress: AudioGuideWithProgress[] = (
          guidesData || []
        ).map((guide) => {
          const progress = progressData.find(
            (p) => p.audio_guide_id === guide.id
          );
          return {
            ...guide,
            progress,
            formattedDuration: formatDuration(guide.duration),
          };
        });

        setAudioGuides(guidesWithProgress);
      } catch (err) {
        console.error("Error fetching audio guides:", err);
        setError("Could not load audio guides. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Group audio guides by category
  const forYouGuides = userGoal
    ? audioGuides.filter(
        (guide) => guide.category === mapGoalToCategory(userGoal)
      )
    : [];

  const otherGuides = userGoal
    ? audioGuides.filter(
        (guide) => guide.category !== mapGoalToCategory(userGoal)
      )
    : audioGuides;

  // Navigate to audio player with the guide details
  const navigateToAudioGuide = (guide: AudioGuideWithProgress) => {
    if (!isSubscribed) {
      setIsPaywallVisible(true);
      return;
    }
    navigation.navigate('AudioGuides', { 
      guideId: guide.id,
      title: guide.title,
      audioUrl: guide.file_path, // Using file_path from the AudioGuide interface
      thumbnailUrl: guide.thumbnail_url,
      description: guide.description,
      lastPosition: guide.progress?.last_position || 0
    });
  };

  const renderItem = ({
    item,
    horizontal = false,
  }: {
    item: AudioGuideWithProgress;
    horizontal?: boolean;
  }) => (
    <AudioGuideCard
      title={item.title}
      description={item.description}
      duration={item.formattedDuration}
      thumbnailUrl={item.thumbnail_url}
      variant={horizontal ? "horizontal" : "default"}
      isPlaying={currentTrack?.id === item.id}
      onPress={() => navigateToAudioGuide(item)}
    />
  );

  const renderHorizontalItem = ({ item }: { item: AudioGuideWithProgress }) => (
    <AudioGuideCard
      title={item.title}
      description={item.description}
      duration={item.formattedDuration}
      thumbnailUrl={item.thumbnail_url}
      variant="horizontal"
      isPlaying={currentTrack?.id === item.id}
      onPress={() => navigateToAudioGuide(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No audio guides available</Text>
      <Text style={styles.emptyDescription}>
        Check back soon for new content
      </Text>
    </View>
  );

  // Section header component
  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const sections = [];
  if (forYouGuides.length > 0) {
    sections.push({
      title: 'For you',
      data: [{ id: 'for-you-list' }], // Dummy data for a single render of the horizontal list
    });
  }
  if (otherGuides.length > 0) {
    sections.push({
      title: 'All guides',
      data: otherGuides,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.skeletonContainer, { paddingTop: 16 }]}>
            {/* Horizontal skeleton for 'For You' section */}
            <Text style={styles.sectionTitle}>For you</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalSkeletonContainer}>
                {[...Array(3)].map((_, idx) => (
                  <View key={`horizontal-${idx}`} style={styles.horizontalSkeletonCard} />
                ))}
              </View>
            </ScrollView>
            
            {/* Vertical skeletons for 'All Guides' section */}
            <View style={[styles.allGuidesHeader]}>
              <Text style={styles.sectionTitle}>All Guides</Text>
            </View>
            {[...Array(4)].map((_, idx) => (
              <View key={`vertical-${idx}`} style={styles.skeletonCard} />
            ))}
          </View>
        </ScrollView>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: any, index: number) => item.id + index}
          renderItem={({ item, section }: { item: any; section: { title: string } }) => {
            if (section.title === 'For you') {
              return (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={forYouGuides}
                  keyExtractor={(guide) => `for-you-${guide.id}`}
                  renderItem={renderHorizontalItem}
                  contentContainerStyle={styles.horizontalListContent}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  snapToInterval={252} // Card width (240) + margin (12)
                />
              );
            }
            return renderItem({ item });
          }}
          renderSectionHeader={({ section: { title } }: { section: { title: string } }) => (
            <View style={title === 'All Guides' && forYouGuides.length > 0 ? styles.allGuidesHeader : {}}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <PaywallModal 
        isVisible={isPaywallVisible}
        featureType="audio_guides"
        onClose={() => setIsPaywallVisible(false)}
      />
    </SafeAreaView>
  );
};

const colors = {
  white: "#FFFFFF",
  gray800: "#242B33",
  gray700: "#495766",
  gray500: "#A1AEBC",
  gray300: "#D7DCE2",
  gray100: "#F2F3F5",
  gray50: "#F8FAFC",
  blue500: "#2154E0", // August blue
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
  },
  headerSpacer: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 32, // Increased from 16 to 32
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    marginBottom: 16,
  },
  horizontalListContent: {
    paddingLeft: 0,
  },
  allGuidesHeader: {
    marginTop: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    color: colors.gray700,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Larsseit",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: "Larsseit",
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  skeletonContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  skeletonCard: {
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    marginBottom: 16,
  },
  horizontalSkeletonContainer: {
    flexDirection: 'row',
    paddingLeft: 0,
    paddingRight: 16,
  },
  horizontalSkeletonCard: {
    width: 240,
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    marginRight: 12,
    marginBottom: 16,
  },
});

export default ExploreScreen;
