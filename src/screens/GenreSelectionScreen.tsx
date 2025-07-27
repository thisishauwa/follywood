"use client";

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft2, TickCircle } from "iconsax-react-nativejs";
import { supabase } from "../services/supabase";

// Navigation types
type RootStackParamList = {
  StudioCreation: undefined;
  GenreSelection: undefined;
  MainTabs: undefined;
};

type GenreSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "GenreSelection"
>;

interface GenreSelectionScreenProps {
  navigation: GenreSelectionScreenNavigationProp;
}

// --- Main GenreSelectionScreen Component ---
const GenreSelectionScreen = ({ navigation }: GenreSelectionScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { user, refreshProfile } = useAuth();

  const genres = [
    "Action", "Comedy", "Drama", "Horror", 
    "Romance", "Thriller", "Biopics", "Art House",
    "Sci-fi", "Fantasy", "Animation", "Docs"
  ];

  // --- Reusable Components ---
  interface ProgressDotsProps {
    currentStep: number;
    totalSteps: number;
  }

  const ProgressDots = ({ currentStep, totalSteps }: ProgressDotsProps) => (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );

  interface BackButtonProps {
    onPress: () => void;
  }

  const BackButton = ({ onPress }: BackButtonProps) => (
    <TouchableOpacity style={styles.backButton} onPress={onPress}>
      <ArrowLeft2 size={24} color="#2E2E2E" />
    </TouchableOpacity>
  );

  const handleContinue = async () => {
    console.log('handleContinue called');
    console.log('selectedGenres:', selectedGenres);
    console.log('user:', user);
    
    if (selectedGenres.length === 0) {
      console.log('No genres selected');
      Alert.alert("Select Genres", "Please choose at least one genre.");
      return;
    }
    if (selectedGenres.length > 3) {
      console.log('Too many genres selected:', selectedGenres.length);
      Alert.alert("Too Many Genres", "Please select up to 3 genres only.");
      return;
    }
    if (!user?.id) {
      console.log('No user ID found');
      Alert.alert("Error", "No user found. Please sign in again.");
      return;
    }

    console.log('Starting profile update...');
    setLoading(true);
    try {
      // Save the selected genres as an array
      const updateData = {
        selected_genres: selectedGenres,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };
      console.log('Update data:', updateData);
      console.log('All selected genres:', selectedGenres);
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        Alert.alert("Error", "Failed to save your genre preferences. Please try again.");
        return;
      }

      console.log('Profile updated successfully!');
      
      // Manually refresh the user profile to trigger navigation
      console.log('Calling refreshProfile to update user state...');
      await refreshProfile();
      
      console.log('Profile refreshed, navigation should happen automatically');
      // Onboarding is now complete, user will be redirected to MainTabs automatically
    } catch (error) {
      console.error('Unexpected error completing onboarding:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      // Remove genre if already selected
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      // Add genre if not selected and under limit
      if (selectedGenres.length < 3) {
        setSelectedGenres([...selectedGenres, genre]);
      } else {
        Alert.alert("Maximum Reached", "You can select up to 3 genres only.");
      }
    }
  };

  const renderGenreButton = (genre: string) => {
    const isSelected = selectedGenres.includes(genre);
    return (
      <TouchableOpacity
        key={genre}
        style={[styles.genreButton, isSelected && styles.genreButtonSelected]}
        onPress={() => handleGenreToggle(genre)}
      >
        <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>
          {genre}
        </Text>
        <View style={styles.iconContainer}>
          {isSelected ? (
            <TickCircle size={24} color="#FFFFFF" variant="Bold" />
          ) : (
            <View style={styles.radioButton} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with back button and progress */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <ProgressDots currentStep={2} totalSteps={3} />
      </View>

      {/* Main content - Scrollable */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Sounds... great 👍🏽</Text>
          <Text style={styles.questionText}>What are you into?</Text>
          <Text style={styles.subText}>Choose up to 3 genres ({selectedGenres.length}/3)</Text>
        </View>

        {/* Genre Grid */}
        <View style={styles.genreGrid}>
          <View style={styles.genreRow}>
            {renderGenreButton("Action")}
            {renderGenreButton("Comedy")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Drama")}
            {renderGenreButton("Horror")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Romance")}
            {renderGenreButton("Thriller")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Biopics")}
            {renderGenreButton("Art House")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Sci-fi")}
            {renderGenreButton("Fantasy")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Animation")}
            {renderGenreButton("Docs")}
          </View>
        </View>


        
        {/* Bottom padding to ensure content can scroll above the button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom continue button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={() => {
            console.log('TouchableOpacity pressed!');
            handleContinue();
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#F5F5F5" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotActive: {
    backgroundColor: '#EE4C01',
  },
  progressDotInactive: {
    backgroundColor: '#F0EEE9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140, // Extra padding to scroll above the button
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 20, // Moved up further
    marginBottom: 30, // Reduced bottom margin
  },
  welcomeText: {
    fontSize: 16,
    color: '#8C8C8C',
    fontFamily: 'BuenosAires-Book',
    textAlign: 'center',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 30,
    color: '#343333',
    fontFamily: 'BuenosAires-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#8C8C8C',
    fontFamily: 'BuenosAires-Book',
    textAlign: 'center',
  },
  genreGrid: {
    gap: 12,
  },
  genreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genreButton: {
    flex: 1,
    minHeight: 64, // Changed from fixed height to minHeight
    paddingHorizontal: 16,
    paddingVertical: 20, // Reduced padding to give more space for text
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DA4500',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreButtonSelected: {
    backgroundColor: '#DA4500',
  },
  genreText: {
    fontSize: 18,
    fontFamily: 'BuenosAires-Book',
    color: '#DA4500',
    flex: 1, // Allow text to take available space
    marginRight: 8, // Add some space before the radio button
  },
  genreTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'BuenosAires-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DA4500',
  },
  signOutButton: {
    alignSelf: 'center',
    marginTop: 30,
    padding: 10,
  },
  bottomPadding: {
    height: 20, // Extra space at the bottom
  },
  signOutText: {
    color: '#8C8C8C',
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  bottomContainer: {
    position: 'absolute', // Make it fixed at the bottom
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2201B2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    height: 120,
    justifyContent: 'flex-start',
  },
  continueButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#F5F5F5',
    fontSize: 18,
    fontFamily: 'BuenosAires-SemiBold',
  },
});

export default GenreSelectionScreen;
