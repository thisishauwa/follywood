"use client";

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft2 } from "iconsax-react-nativejs";
import { supabase } from "../services/supabase";
import { generateNickname, extractFirstName } from "../utils/nicknameService";

// Navigation types
type RootStackParamList = {
  Login: undefined;
  FullName: undefined;
  StudioCreation: { nickname: string };
  GenreSelection: undefined;
  MainTabs: undefined;
};

type FullNameScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "FullName"
>;

interface FullNameScreenProps {
  navigation: FullNameScreenNavigationProp;
}

// Form validation types
interface FormData {
  fullName: string;
}

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
          index === currentStep
            ? styles.progressDotActive
            : styles.progressDotInactive,
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

// --- Main FullNameScreen Component ---
const FullNameScreen = ({ navigation }: FullNameScreenProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      fullName: "",
    },
    mode: "onBlur",
  });

  const handleContinue = async (data: FormData) => {
    if (!user?.id) {
      Alert.alert("Error", "No user found. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile with full name:", error);
        Alert.alert("Error", "Failed to save your name. Please try again.");
        return;
      }

      // Generate nickname from first name
      const firstName = extractFirstName(data.fullName);
      const nickname = await generateNickname(firstName);
      
      // Navigate to studio creation screen with nickname
      navigation.navigate("StudioCreation", { nickname });
    } catch (error) {
      console.error("Unexpected error saving full name:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header with back button and progress */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <ProgressDots currentStep={0} totalSteps={2} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Hey, welcome to Follywood 👋</Text>
          <Text style={styles.questionText}>What's your name?</Text>
        </View>

        {/* Input field */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="fullName"
            rules={{
              required: "Full name is required",
              minLength: {
                value: 2,
                message: "Please enter your full name",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#B7B7B7"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                autoCorrect={false}
              />
            )}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName.message}</Text>
          )}
        </View>
      </View>

      {/* Bottom continue button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            loading && styles.continueButtonDisabled,
          ]}
          onPress={async () => {
            const isValid = await trigger("fullName");
            if (isValid) handleSubmit(handleContinue)();
          }}
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotActive: {
    backgroundColor: "#EE4C01",
  },
  progressDotInactive: {
    backgroundColor: "#F0EEE9",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 16,
    color: "#8C8C8C",
    fontFamily: "BuenosAires-Book",
    textAlign: "center",
    marginBottom: 4,
  },
  questionText: {
    fontSize: 30,
    color: "#343333",
    fontFamily: "BuenosAires-SemiBold",
    textAlign: "center",
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "BuenosAires-Book",
    color: "#343333",
    textAlign: "center",
  },
  errorText: {
    color: "#EE4C01",
    fontSize: 14,
    marginTop: 8,
    fontFamily: "BuenosAires-Book",
    textAlign: "center",
  },
  bottomContainer: {
    backgroundColor: "#2201B2",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    height: 120,
    justifyContent: "flex-start",
  },
  continueButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#F5F5F5",
    fontSize: 18,
    fontFamily: "BuenosAires-SemiBold",
  },
});

export default FullNameScreen;
