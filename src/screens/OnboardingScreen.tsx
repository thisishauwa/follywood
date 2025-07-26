"use client";

import { StackNavigationProp } from "@react-navigation/stack";
import { useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Navigation types
type RootStackParamList = {
  Onboarding: undefined;
  GettingStarted: undefined;
  AboutYou: undefined;
  CreateAccount: undefined;
  Login: undefined;
  Home: undefined;
};

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
}

// --- Utilities ---
// Get the current window dimensions for responsive calculations
const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

// Helper to convert Figma's Tailwind-like unit values to React Native DP.
const toDp = (value: number): number => value * 4;

// Slide content data
const slideData = [
  {
    title: "Your personal sex guide",
    subtitle:
      "A safe space to explore, learn, and grow your sexual wellness without judgment.",
  },
  {
    title: "Learn at your own pace",
    subtitle:
      "Expert-guided audio content, personalized insights, and supportive AI conversations.",
  },
  {
    title: "Track your journey",
    subtitle:
      "Set goals, journal your feelings, and watch your Sexual Happiness Score grow over time.",
  },
];

// --- Reusable Components ---

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
}

/**
 * Renders a primary or secondary action button with distinct styles and shadows.
 */
const PrimaryButton = ({
  title,
  onPress = () => {},
  variant = "primary",
}: PrimaryButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      buttonStyles.baseButtonOuter,
      variant === "primary" && buttonStyles.primaryButtonOuter,
      variant === "secondary" && buttonStyles.secondaryButtonOuter,
    ]}
  >
    <View
      style={[
        buttonStyles.baseButtonInner,
        variant === "primary" && buttonStyles.primaryButtonInner,
        variant === "secondary" && buttonStyles.secondaryButtonInner,
      ]}
    >
      <Text
        style={[
          buttonStyles.baseButtonText,
          variant === "primary" && buttonStyles.primaryButtonText,
          variant === "secondary" && buttonStyles.secondaryButtonText,
        ]}
      >
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

PrimaryButton.defaultProps = {
  onPress: () => {},
  variant: "primary",
};

interface PaginationDotsProps {
  totalDots: number;
  activeDotIndex: number;
  activeColor?: string;
  inactiveColor?: string;
}

/**
 * Renders a series of pagination dots, with one active dot.
 */
const PaginationDots = ({
  totalDots,
  activeDotIndex,
  activeColor = "#3B82F6",
  inactiveColor = "#C4B5FD",
}: PaginationDotsProps) => (
  <View style={paginationStyles.dotsContainer}>
    {Array.from({ length: totalDots }).map((_, index) => (
      <View
        key={index}
        style={[
          paginationStyles.dot,
          {
            backgroundColor:
              index === activeDotIndex ? activeColor : inactiveColor,
          },
        ]}
      />
    ))}
  </View>
);

PaginationDots.defaultProps = {
  activeColor: "#3B82F6", // blue-700
  inactiveColor: "#C4B5FD", // violet-200
};

/**
 * Renders a placeholder view for the image/card section.
 */
const ImagePlaceholder = () => {
  // Original Figma dimensions: w-72 (288px), h-96 (384px)
  const originalWidth = 288;
  const originalHeight = 384;
  const aspectRatio = originalHeight / originalWidth;

  // Set width to screen width minus 40px (20px margin on each side)
  const responsiveWidth = windowWidth - 40;
  const responsiveHeight = responsiveWidth * aspectRatio;

  return (
    <View
      style={[
        imagePlaceholderStyles.container,
        { width: responsiveWidth, height: responsiveHeight },
      ]}
    />
  );
};

// --- Main OnboardingScreen Component ---

const OnboardingScreen = ({ navigation }: OnboardingScreenProps) => {
  const handleGetStarted = () => {
    console.log("Get started pressed");
    // Navigate to Login screen
    navigation.navigate("Login");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/Onboardingbg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeAreaContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        {/* Main content container */}
        <View style={styles.mainContainer}>
          <View style={styles.spacer} />

          {/* Logo and title section - centered vertically */}
          <View style={styles.contentSection}>
            <Image
              source={require("../../assets/images/ttalogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.titleText}>Better sex starts right here</Text>
          </View>

          {/* Get started button */}
          <View style={styles.buttonSection}>
            <PrimaryButton
              title="Get started"
              onPress={handleGetStarted}
              variant="secondary"
            />
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

// --- Stylesheets ---

const buttonStyles = StyleSheet.create({
  baseButtonOuter: {
    alignSelf: "stretch",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  baseButtonInner: {
    flex: 1,
    paddingHorizontal: toDp(4), // 16px
    paddingVertical: toDp(3), // 12px
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(2), // 8px
    overflow: "hidden",
  },
  baseButtonText: {
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },

  // Primary Button Specific Styles
  primaryButtonOuter: {
    ...Platform.select({
      ios: {
        shadowColor: "rgba(189,95,2,1)", // Custom orange shadow color
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonInner: {
    backgroundColor: "#FB923C", // orange-400
    borderColor: "#FB923C",
  },
  primaryButtonText: {
    color: "#FFFFFF", // white
  },

  // Secondary Button Specific Styles
  secondaryButtonOuter: {
    ...Platform.select({
      ios: {
        shadowColor: "rgba(240,146,53,1)", // Lighter orange shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  secondaryButtonInner: {
    backgroundColor: "#FFFFFF", // white background
    borderColor: "#FB923C", // orange-400 border
  },
  secondaryButtonText: {
    color: "#FB923C", // orange-400 text
  },
});

const paginationStyles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: toDp(1.5), // 6px gap between dots
  },
  dot: {
    width: toDp(1.5), // 6px
    height: toDp(1.5), // 6px
    borderRadius: 9999, // Makes it a perfect circle
  },
});

const imagePlaceholderStyles = StyleSheet.create({
  container: {
    backgroundColor: "#D4D4D4", // zinc-300
    borderRadius: 29,
    alignSelf: "center",
    maxHeight: 350, // Increased from 260 to make it longer
  },
});

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mainContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 34, // Space for home indicator
  },
  spacer: {
    flex: 0.15, // Creates space at the top to push content down
  },
  contentSection: {
    width: 280, // Increased width to prevent text wrapping to 3 lines
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15, // gap-3 in Tailwind
    flex: 1, // Takes up available space in the middle
  },
  logo: {
    width: 64, // w-14 in Tailwind (14 * 4 = 56)
    height: 64, // h-14 in Tailwind
  },
  titleText: {
    width: "100%",
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 32, // text-3xl
    fontWeight: "300", // font-light
    fontFamily: "Larsseit",
    lineHeight: 36, // leading-loose
  },
  buttonSection: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 12, // gap-3
    marginTop: 48, // Add space between content section and button
  },
});

export default OnboardingScreen;
