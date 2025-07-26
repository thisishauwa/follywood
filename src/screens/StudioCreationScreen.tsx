"use client";

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft2 } from "iconsax-react-nativejs";
import { supabase } from "../services/supabase";

type RootStackParamList = {
  FullName: undefined;
  StudioCreation: undefined;
  GenreSelection: undefined;
  MainTabs: undefined;
};

type StudioCreationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'StudioCreation'>;

interface StudioCreationScreenProps {
  navigation: StudioCreationScreenNavigationProp;
}

const StudioCreationScreen = ({ navigation }: StudioCreationScreenProps) => {
  const { user, signOut } = useAuth();
  const [studioName, setStudioName] = useState('');
  const [loading, setLoading] = useState(false);



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
    if (!studioName.trim()) {
      Alert.alert("Invalid Name", "Please enter a name for your studio.");
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
          studio_name: studioName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile with studio name:', error);
        Alert.alert("Error", "Failed to save your studio name. Please try again.");
        return;
      }

      // Navigate to genre selection screen
      navigation.navigate('GenreSelection');
    } catch (error) {
      console.error('Unexpected error saving studio name:', error);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with back button and progress */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <ProgressDots currentStep={1} totalSteps={2} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Almost there! 🎬</Text>
          <Text style={styles.questionText}>What's your studio name?</Text>
        </View>

        {/* Input field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your studio name"
            placeholderTextColor="#B7B7B7"
            value={studioName}
            onChangeText={setStudioName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          

          
          {/* Sign out option */}
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Need to start over? Sign out</Text>
          </TouchableOpacity>
        </View>
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
        
        {/* The native home indicator will be shown against the container background */}
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
    marginTop: 100,
    marginBottom: 32,
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
  inputContainer: {
    paddingHorizontal: 0,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#343333',
    textAlign: 'center',
    marginBottom: 24,
  },
  genreTitle: {
    fontSize: 18,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#343333',
    marginBottom: 16,
    textAlign: 'center',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  chip: {
    backgroundColor: '#F7F7F7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  chipSelected: {
    backgroundColor: '#EE4C01',
    borderColor: '#EE4C01',
  },
  chipText: {
    color: '#343333',
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'BuenosAires-SemiBold',
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
  signOutButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 10,
  },
  signOutText: {
    color: '#8C8C8C',
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default StudioCreationScreen;
