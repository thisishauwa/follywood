"use client";

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { Apple } from "iconsax-react-nativejs";
import Svg, { Path } from "react-native-svg";
import AuthInputField from "../components/AuthInputField";

// Navigation types
type RootStackParamList = {
  Onboarding: undefined;
  GettingStarted: undefined;
  AboutYou: undefined;
  Login: undefined;
  CreateAccount: undefined;
  Home: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// Form validation types
interface FormData {
  email: string;
  token: string;
}

// --- Utilities ---
const { width: windowWidth } = Dimensions.get("window");
const toDp = (value: number): number => value * 4;
const getResponsiveHorizontalPadding = (originalPx: number): number => {
  const originalDesignWidth = 384;
  return (originalPx / originalDesignWidth) * windowWidth;
};

// --- Reusable Components ---

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
}: PrimaryButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={disabled ? 1 : 0.7}
    style={[
      buttonStyles.primaryButtonOuter,
      disabled && { shadowOpacity: 0, elevation: 0 },
    ]}
    disabled={disabled}
  >
    <View
      style={[
        buttonStyles.primaryButtonInner,
        disabled && buttonStyles.primaryButtonDisabled,
      ]}
    >
      <Text
        style={[
          buttonStyles.primaryButtonText,
          disabled && buttonStyles.primaryButtonTextDisabled,
        ]}
      >
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

const OrDivider = () => (
  <View style={orDividerStyles.container}>
    <View style={orDividerStyles.line} />
    <Text style={orDividerStyles.text}>or</Text>
    <View style={orDividerStyles.line} />
  </View>
);

interface SocialLoginButtonProps {
  type: "google" | "apple";
  onPress: () => void;
}

const GoogleIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.818 10.182h-9.818v3.636h5.582c-.245 1.173-.964 2.182-2.136 2.91v2.364h3.045c1.782-1.636 2.818-4.091 2.818-6.91 0-.655-.064-1.291-.173-1.91z"
      fill="#4285F4"
    />
    <Path
      d="M12 22c2.618 0 4.818-0.864 6.427-2.336l-3.045-2.364c-.873.582-2 0.91-3.382 0.91-2.582 0-4.773-1.745-5.555-4.091H3.373v2.455C5.018 19.882 8.273 22 12 22z"
      fill="#34A853"
    />
    <Path
      d="M6.445 13.909c-.173-.527-.273-1.091-.273-1.664s0.1-1.136 0.273-1.664V8.127H3.373c-.645 1.273-1.018 2.727-1.018 4.273s0.373 3 1.018 4.273l3.072-2.455z"
      fill="#FBBC05"
    />
    <Path
      d="M12 6.136c1.418 0 2.718.491 3.727 1.455l2.7-2.7C16.818 3.245 14.618 2 12 2 8.273 2 5.018 4.118 3.373 6.818l3.072 2.455C7.227 7.018 9.418 6.136 12 6.136z"
      fill="#EA4335"
    />
  </Svg>
);

const SocialLoginButton = ({ type, onPress }: SocialLoginButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      socialButtonStyles.buttonContainer,
      type === "google" && socialButtonStyles.googleButton,
      type === "apple" && socialButtonStyles.appleButton,
    ]}
  >
    {type === "google" ? <GoogleIcon /> : <Apple size={24} color="#FFFFFF" />}
    <Text
      style={[
        socialButtonStyles.buttonText,
        type === "google"
          ? socialButtonStyles.googleText
          : socialButtonStyles.appleText,
      ]}
    >
      Sign in with {type === "google" ? "Google" : "Apple"}
    </Text>
  </TouchableOpacity>
);

// --- Main LoginScreen Component ---
const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const { signInWithOtp, verifyOtp, signInWithGoogle, signInWithApple } =
    useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    clearErrors,
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      token: "",
    },
    mode: "onBlur",
  });

  // Step 1: Send OTP to user's email
  const handleSendOtp = async (data: { email: string }) => {
    setLoading(true);
    try {
      const response = await signInWithOtp(data.email);
      if (response.success) {
        Alert.alert(
          "Check your email",
          `We've sent a login code to ${data.email}.`
        );
        setEmailForVerification(data.email); // Store email for verification
        setOtpSent(true);
        // Clear form errors and reset for OTP entry
        clearErrors();
        control._reset({
          email: "", // Clear email field
          token: "", // Clear token field for OTP entry
        });
      } else {
        Alert.alert(
          "Login Failed",
          response.error?.message || "An error occurred."
        );
      }
    } catch (error) {
      Alert.alert(
        "Login Error",
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and sign in
  const handleVerifyOtp = async (data: { token: string }) => {
    setLoading(true);
    try {
      const response = await verifyOtp(emailForVerification, data.token);
      if (!response.success) {
        Alert.alert(
          "Login Failed",
          response.error?.message || "Invalid login code."
        );
      }
      // On successful login, the AuthProvider's onAuthStateChange will handle navigation
    } catch (error) {
      Alert.alert(
        "Login Error",
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert(
      "Coming Soon",
      "Google Sign-In is coming soon! For now, please use OTP sign-in to access your account."
    );
  };

  const handleAppleSignIn = async () => {
    try {
      const response = await signInWithApple();
      if (!response.success) {
        // Only show error if it's not user cancellation
        if (response.error?.code !== "user_cancelled") {
          Alert.alert(
            "Apple Sign-In Failed",
            response.error?.message || "An error occurred during Apple sign-in."
          );
        }
      }
      // On successful sign-in, the AuthProvider's onAuthStateChange will handle navigation
    } catch (error) {
      Alert.alert(
        "Apple Sign-In Error",
        "An unexpected error occurred. Please try again."
      );
    }
  };

  const handleContactSupport = () => {
    Linking.openURL(
      "mailto:hello@talktoaugust.com?subject=Hello,%20I'm%20having%20trouble%20logging%20in"
    );
  };



  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {isBannerVisible && (
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>📢 Security update</Text>
            <Text style={styles.bannerText}>
              We've upgraded to passwordless authentication for better security.
              Simply enter your email to receive a login code.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsBannerVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mainContentBlock}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>
            {otpSent ? "Check your email" : "Sign in or create an account"}
          </Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? `We sent a login code to ${emailForVerification}`
              : "Enter your email and we'll send you an OTP."}
          </Text>
        </View>

        <View style={styles.inputFieldsSection}>
          {!otpSent ? (
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInputField
                  placeholder="Email address"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCorrect={false}
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="token"
              rules={{
                required: "Login code is required",
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: "Please enter a valid 6-digit code",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInputField
                  placeholder="Enter 6-digit code"
                  value={value}
                  onChangeText={onChange}
                  error={errors.token?.message}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              )}
            />
          )}
          {otpSent && (
            <TouchableOpacity
              onPress={() => setOtpSent(false)}
              activeOpacity={0.7}
              style={styles.changeEmailLink}
            >
              <Text style={styles.linkText}>Use a different email</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonsAndSocialSection}>
          {!otpSent ? (
            <PrimaryButton
              title={loading ? "Sending..." : "Send login code"}
              onPress={handleSubmit(handleSendOtp)}
              disabled={loading}
            />
          ) : (
            <PrimaryButton
              title={loading ? "Signing in..." : "Verify & sign in"}
              onPress={handleSubmit(handleVerifyOtp)}
              disabled={loading}
            />
          )}

          <OrDivider />

          <View style={styles.socialButtonsContainer}>
            {/* <SocialLoginButton type="google" onPress={handleGoogleSignIn} /> */}
            <SocialLoginButton type="apple" onPress={handleAppleSignIn} />
          </View>
        </View>
      </View>
      
      {/* Onboarding and Support links at bottom */}
      <View style={styles.bottomSupportContainer}>

        {/* Support link */}
        <View style={styles.createAccountPrompt}>
          <Text style={styles.createAccountPromptText}>Having trouble? </Text>
          <TouchableOpacity
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Contact support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Stylesheets ---

const buttonStyles = StyleSheet.create({
  primaryButtonOuter: {
    alignSelf: "stretch",
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(189,95,2,1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: { elevation: 4 },
    }),
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  primaryButtonInner: {
    flex: 1,
    paddingHorizontal: toDp(4),
    paddingVertical: toDp(3),
    backgroundColor: "#FB923C",
    borderRadius: 12,
    borderColor: "#FB923C",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(2),
    overflow: "hidden",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },
  primaryButtonDisabled: {
    backgroundColor: "#D1D5DB",
    borderColor: "#D1D5DB",
  },
  primaryButtonTextDisabled: {
    color: "#9CA3AF",
  },
});

const orDividerStyles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(10),
  },
  line: {
    flex: 1,
    height: 1,
    borderColor: "#E5E7EB",
    borderWidth: 0.5,
  },
  text: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },
});

const socialButtonStyles = StyleSheet.create({
  buttonContainer: {
    alignSelf: "stretch",
    height: 48,
    paddingHorizontal: toDp(4),
    paddingVertical: toDp(2.5),
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(16,24,40,0.05)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(3),
    overflow: "hidden",
  },
  googleButton: { backgroundColor: "#F3F4F6" },
  appleButton: { backgroundColor: "#171717" },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 16,
  },
  googleText: { color: "#4B5563" },
  appleText: { color: "#FFFFFF" },
});

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContentBlock: {
    flex: 1,
    width: windowWidth - getResponsiveHorizontalPadding(20) * 2,
    alignSelf: "center",
    paddingTop: getResponsiveHorizontalPadding(24),
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(8),
  },
  headerSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  title: {
    alignSelf: "stretch",
    color: "#1F2937",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Larsseit",
    lineHeight: 28,
  },
  subtitle: {
    alignSelf: "stretch",
    color: "#64748B",
    fontSize: 14,
    marginTop: toDp(1),
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 18,
  },
  inputFieldsSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(4),
  },
  buttonsAndSocialSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(6),
  },
  socialButtonsContainer: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(4),
  },
  bottomSupportContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 34, // Space for home indicator
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  createAccountPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: toDp(2),
  },
  createAccountPromptText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },
  linkText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
    textDecorationLine: "underline",
  },
  changeEmailLink: {
    alignSelf: "flex-end",
    marginTop: toDp(1),
  },
  bannerContainer: {
    backgroundColor: "#F0F9FF", // light blue-50
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomColor: "#E0F2FE", // blue-100
  },
  bannerContent: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C4A6E", // blue-900
    fontFamily: "Larsseit",
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: "#0369A1", // blue-700
    fontFamily: "Larsseit",
    lineHeight: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#64748B", // slate-500
  },
});

export default LoginScreen;
