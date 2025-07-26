"use client";

import { StackNavigationProp } from "@react-navigation/stack";
import { ArrowLeft2 } from "iconsax-react-nativejs";
import { useState } from "react";
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { profileService } from "../services/profile";

// Navigation types
type RootStackParamList = {
  Onboarding: undefined;
  GettingStarted: undefined;
  AboutYou: undefined;
  CreateAccount: undefined;
  Login: undefined;
};

type GettingStartedScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "GettingStarted"
>;

interface GettingStartedScreenProps {
  navigation: GettingStartedScreenNavigationProp;
}

// --- Utilities ---
// Get the current window dimensions for responsive calculations
const { width: windowWidth } = Dimensions.get("window");

// Helper to convert Figma's Tailwind-like unit values to React Native DP.
const toDp = (value: number): number => value * 4;

// Calculates horizontal padding/margin based on original Figma design width (384px)
const getResponsiveHorizontalPadding = (originalPx: number): number => {
  const originalDesignWidth = 384;
  return (originalPx / originalDesignWidth) * windowWidth;
};

// --- Reusable Components ---

interface SelectionButtonProps {
  title: string;
  backgroundColor?: string;
  textColor?: string;
  onPress?: () => void;
}

/**
 * Renders a selection button with customizable colors.
 */
const SelectionButton = ({
  title,
  backgroundColor = "#DCDFEF",
  textColor = "#3B82F6",
  onPress = () => { },
}: SelectionButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      selectionButtonStyles.container,
      { backgroundColor: backgroundColor },
    ]}
  >
    <Text style={[selectionButtonStyles.text, { color: textColor }]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// --- Main GettingStartedScreen Component ---

/**
 * GettingStartedScreen component: Presents options to the user on how the app can help them.
 * It's fully responsive and handles native system UI elements dynamically.
 *
 * In a real application, each button press would navigate to a different section
 * or personalize the user's experience.
 */
const GettingStartedScreen = ({ navigation }: GettingStartedScreenProps) => {
  const { user } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<
    "teach_me" | "improve_sex" | "enhance_sex" | null
  >(null);

  const handleBack = () => {
    console.log("Back button pressed");
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      console.log("Cannot go back, already at the top of the stack.");
    }
  };

  const handleSaveSelection = async (
    goal_preference: "teach_me" | "improve_sex" | "enhance_sex"
  ) => {
    setSelectedGoal(goal_preference);

    if (!user) {
      console.error("User not found, cannot save selection.");
      return;
    }

    try {
      await profileService.updateOnboardingData(user.id, { goal_preference });
      console.log(`${goal_preference} path selected and saved.`);
      // Use a brief timeout to allow the user to see the selection feedback before navigating
      setTimeout(() => {
        navigation.navigate("AboutYou");
      }, 200);
    } catch (error) {
      console.error("Failed to save selection:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation: Back Button & "Getting started" title */}
      <View style={styles.topNavSection}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <ArrowLeft2 size={24} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.gettingStartedTitle}>Getting started</Text>
        {/* An empty View to balance space if needed, or remove if not necessary */}
        <View style={styles.rightSpacer} />
      </View>

      {/* Main Content Block */}
      <View style={styles.mainContentBlock}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>How can I help?</Text>
          <Text style={styles.subtitle}>
            Basically, I'm asking why you're here today.
          </Text>
        </View>

        {/* Selection Buttons */}
        <View style={styles.selectionButtonsContainer}>
          <SelectionButton
            title="Teach me about sex"
            backgroundColor={
              selectedGoal === "teach_me" ? "#2154E0" : "#E9EEFC"
            }
            textColor={selectedGoal === "teach_me" ? "#FFFFFF" : "#2154E0"}
            onPress={() => handleSaveSelection("teach_me")}
          />
          <SelectionButton
            title="I know the basics; help me improve"
            backgroundColor={
              selectedGoal === "improve_sex" ? "#2154E0" : "#E9EEFC"
            }
            textColor={selectedGoal === "improve_sex" ? "#FFFFFF" : "#2154E0"}
            onPress={() => handleSaveSelection("improve_sex")}
          />
          <SelectionButton
            title="I'm experienced; I want sex to be explosive"
            backgroundColor={
              selectedGoal === "enhance_sex" ? "#2154E0" : "#E9EEFC"
            }
            textColor={selectedGoal === "enhance_sex" ? "#FFFFFF" : "#2154E0"}
            onPress={() => handleSaveSelection("enhance_sex")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Stylesheets ---

const selectionButtonStyles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    height: 64, // h-16
    paddingHorizontal: toDp(2.5), // 10px
    paddingVertical: toDp(3), // 12px
    borderRadius: 12, // rounded-xl
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(2.5), // 10px
  },
  text: {
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
});

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topNavSection: {
    width: "100%",
    paddingHorizontal: getResponsiveHorizontalPadding(13), // From original left-[13px]
    marginTop: getResponsiveHorizontalPadding(20), // Consistent top margin
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 24, // w-6
    height: 24, // h-6
    position: "relative",
  },

  gettingStartedTitle: {
    flex: 1, // Allows title to take available space
    textAlign: "center",
    color: "#171717", // neutral-900
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
  rightSpacer: {
    width: 24, // To visually balance the back button on the left
    height: 24,
  },

  mainContentBlock: {
    flex: 1, // Allows this section to grow
    width: windowWidth - getResponsiveHorizontalPadding(20) * 2, // Content width based on original 20px side margins
    alignSelf: "center", // Centers the block horizontally
    marginTop: getResponsiveHorizontalPadding(50), // Adjusted to push down from the top nav, based on original top-[270px]
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(11), // 44px gap between header and selection buttons
  },
  headerSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center", // Centers text based on HTML
    gap: toDp(1), // 4px gap between title and subtitle
  },
  title: {
    color: "#1F2937", // gray-800
    fontSize: 24, // text-2xl
    fontWeight: "700", // bold
    fontFamily: "Larsseit",
    lineHeight: 32, // loose (1.5 * 24px = 36px, Figma is 32px)
  },
  subtitle: {
    textAlign: "center",
    color: "#64748B", // slate-500
    fontSize: 14, // text-sm
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 18, // tight (from Figma)
  },
  selectionButtonsContainer: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(3), // 12px gap between buttons
  },
});

export default GettingStartedScreen;
