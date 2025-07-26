"use client";

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft2 } from "iconsax-react-nativejs";
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
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const { user, signOut } = useAuth();

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
    if (!selectedGenre) {
      Alert.alert("Select a Genre", "Please choose your preferred genre.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "No user found. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          genre: selectedGenre,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        Alert.alert("Error", "Failed to save your genre preference. Please try again.");
        return;
      }

      // Onboarding is now complete, user will be redirected to MainTabs automatically
    } catch (error) {
      console.error('Unexpected error completing onboarding:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You'll need to start the onboarding process again.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const renderGenreButton = (genre: string, isSelected: boolean) => (
    <TouchableOpacity
      key={genre}
      style={[styles.genreButton, isSelected && styles.genreButtonSelected]}
      onPress={() => setSelectedGenre(genre)}
    >
      <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>
        {genre}
      </Text>
      <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
        {isSelected && <View style={styles.radioButtonInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with back button and progress */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <ProgressDots currentStep={2} totalSteps={3} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Sounds... great 👍🏽</Text>
          <Text style={styles.questionText}>What are you into?</Text>
        </View>

        {/* Genre Grid */}
        <View style={styles.genreGrid}>
          <View style={styles.genreRow}>
            {renderGenreButton("Action", selectedGenre === "Action")}
            {renderGenreButton("Comedy", selectedGenre === "Comedy")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Drama", selectedGenre === "Drama")}
            {renderGenreButton("Horror", selectedGenre === "Horror")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Romance", selectedGenre === "Romance")}
            {renderGenreButton("Thriller", selectedGenre === "Thriller")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Biopics", selectedGenre === "Biopics")}
            {renderGenreButton("Art House", selectedGenre === "Art House")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Sci-fi", selectedGenre === "Sci-fi")}
            {renderGenreButton("Fantasy", selectedGenre === "Fantasy")}
          </View>
          <View style={styles.genreRow}>
            {renderGenreButton("Animation", selectedGenre === "Animation")}
            {renderGenreButton("Docs", selectedGenre === "Docs")}
          </View>
        </View>

        {/* Sign out option */}
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Need to start over? Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom continue button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
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
    height: 64,
    paddingHorizontal: 16,
    paddingVertical: 24,
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
  },
  genreTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'BuenosAires-SemiBold',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DA4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: 'transparent',
  },
  radioButtonInner: {
    width: 10,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  signOutButton: {
    alignSelf: 'center',
    marginTop: 30,
    padding: 10,
  },
  signOutText: {
    color: '#8C8C8C',
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  bottomContainer: {
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
