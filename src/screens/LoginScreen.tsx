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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import { useForm, Controller } from "react-hook-form";


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
const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

// --- Main LoginScreen Component ---
const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const { signInWithOtp, verifyOtp } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    clearErrors,
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      token: "",
    },
    mode: "onSubmit",
    shouldUnregister: true,
  });

  // Step 1: Send OTP to user's email
  const handleSendOtp = async (data: FormData) => {
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
  const handleVerifyOtp = async (data: FormData) => {
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

  const handleContactSupport = () => {
    Linking.openURL(
      "mailto:support@fantasyfilmleague.com?subject=Login%20Help"
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header spacer for status bar */}
      <View style={styles.headerSpacer} />

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Sign in with OTP</Text>
          <Text style={styles.questionText}>
            {otpSent ? "Enter the code we sent" : "What's your email?"}
          </Text>
        </View>

        {/* Input field */}
        <View style={styles.inputContainer}>
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
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#B7B7B7"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
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
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#B7B7B7"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              )}
            />
          )}
          {!otpSent && errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}
          {otpSent && errors.token && (
            <Text style={styles.errorText}>{errors.token.message}</Text>
          )}

          {otpSent && (
            <TouchableOpacity
              onPress={() => setOtpSent(false)}
              style={styles.changeEmailButton}
            >
              <Text style={styles.changeEmailText}>Use a different email</Text>
            </TouchableOpacity>
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
            if (!otpSent) {
              const isValid = await trigger("email");
              if (isValid) handleSubmit(handleSendOtp)();
            } else {
              const isValid = await trigger("token");
              if (isValid) handleSubmit(handleVerifyOtp)();
            }
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
  headerSpacer: {
    paddingTop: 75,
    paddingBottom: 20,
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
  changeEmailButton: {
    marginTop: 16,
    alignSelf: "center",
  },
  changeEmailText: {
    color: "#8C8C8C",
    fontSize: 16,
    fontFamily: "BuenosAires-Book",
    textDecorationLine: "underline",
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
    marginTop: 10, // Pushes the button down slightly from the top
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

export default LoginScreen;
