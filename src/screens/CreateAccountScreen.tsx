"use client"

import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity, Dimensions, TextInput, Alert, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { StackNavigationProp } from '@react-navigation/stack'
import { useAuth } from '../contexts/AuthContext'
import { useForm, Controller } from 'react-hook-form'
import { ArrowLeft, Eye, EyeSlash, Apple } from 'iconsax-react-nativejs'
import Svg, { Path } from 'react-native-svg'
import AuthInputField from "../components/AuthInputField";

// Navigation types
type RootStackParamList = {
  Onboarding: undefined;
  GettingStarted: undefined;
  AboutYou: undefined;
  Login: undefined;
  CreateAccount: undefined;
  Home: undefined;
}

type CreateAccountScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateAccount'>

interface CreateAccountScreenProps {
  navigation: CreateAccountScreenNavigationProp;
}

// Form validation types
interface FormData {
  username: string;
  email: string;
  password: string;
  referralCode: string;
  agreedToTerms: boolean;
}

// --- Utilities ---
// Get the current window dimensions for responsive calculations
const { width: windowWidth } = Dimensions.get("window")

// Helper to convert Figma's Tailwind-like unit values to React Native DP.
const toDp = (value: number): number => value * 4

// Calculates horizontal padding/margin based on original Figma design width (384px)
// This helps maintain proportional spacing on screens of different widths.
const getResponsiveHorizontalPadding = (originalPx: number): number => {
  const originalDesignWidth = 384
  return (originalPx / originalDesignWidth) * windowWidth
}

// --- Reusable Components ---

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
}

/**
 * Renders a primary action button with a distinct background and shadow, as per Figma.
 */
const PrimaryButton = ({ title, onPress }: PrimaryButtonProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={buttonStyles.primaryButtonOuter}>
    <View style={buttonStyles.primaryButtonInner}>
      <Text style={buttonStyles.primaryButtonText}>{title}</Text>
    </View>
  </TouchableOpacity>
)

interface CheckboxWithTextProps {
  isChecked: boolean;
  onToggle: () => void;
  onTermsPress: () => void;
  onPrivacyPress: () => void;
}

/**
 * Renders a custom checkbox with associated text, including clickable links.
 */
const CheckboxWithText = ({ isChecked, onToggle, onTermsPress, onPrivacyPress }: CheckboxWithTextProps) => (
  <View style={checkboxStyles.container}>
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={checkboxStyles.checkboxWrapper}>
      <View style={[checkboxStyles.checkbox, isChecked && checkboxStyles.checkboxChecked]}>
        {isChecked && <View style={checkboxStyles.checkmark} />}
      </View>
    </TouchableOpacity>
    <Text style={checkboxStyles.text}>
      <Text style={checkboxStyles.normalText}>By signing up, you agree to Talk to August's </Text>
      <Text onPress={onTermsPress} style={checkboxStyles.linkText}>
        Terms & Conditions
      </Text>
      <Text style={checkboxStyles.normalText}> and </Text>
      <Text onPress={onPrivacyPress} style={checkboxStyles.linkText}>
        Privacy Policy
      </Text>
    </Text>
  </View>
)

/**
 * Renders a horizontal divider with "or" text in the middle.
 */
const OrDivider = () => (
  <View style={orDividerStyles.container}>
    <View style={orDividerStyles.line} />
    <Text style={orDividerStyles.text}>or</Text>
    <View style={orDividerStyles.line} />
  </View>
)

interface SocialLoginButtonProps {
  type: 'google' | 'apple';
  onPress: () => void;
}

/**
 * Renders a social login button (e.g., Google, Apple) with a custom icon.
 */
const GoogleIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M21.818 10.182h-9.818v3.636h5.582c-.245 1.173-.964 2.182-2.136 2.91v2.364h3.045c1.782-1.636 2.818-4.091 2.818-6.91 0-.655-.064-1.291-.173-1.91z" fill="#4285F4" />
    <Path d="M12 22c2.618 0 4.818-0.864 6.427-2.336l-3.045-2.364c-.873.582-2 0.91-3.382 0.91-2.582 0-4.773-1.745-5.555-4.091H3.373v2.455C5.018 19.882 8.273 22 12 22z" fill="#34A853" />
    <Path d="M6.445 13.909c-.173-.527-.273-1.091-.273-1.664s0.1-1.136 0.273-1.664V8.127H3.373c-.645 1.273-1.018 2.727-1.018 4.273s0.373 3 1.018 4.273l3.072-2.455z" fill="#FBBC05" />
    <Path d="M12 6.136c1.418 0 2.718.491 3.727 1.455l2.7-2.7C16.818 3.245 14.618 2 12 2 8.273 2 5.018 4.118 3.373 6.818l3.072 2.455C7.227 7.018 9.418 6.136 12 6.136z" fill="#EA4335" />
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
        type === "google" ? socialButtonStyles.googleText : socialButtonStyles.appleText,
      ]}
    >
      Sign up with {type === "google" ? "Google" : "Apple"}
    </Text>
  </TouchableOpacity>
)

interface DisablablePrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Renders a primary action button that can be disabled.
 */
const DisablablePrimaryButton = ({ title, onPress, disabled = false }: DisablablePrimaryButtonProps) => (
  <TouchableOpacity 
    onPress={disabled ? undefined : onPress} 
    activeOpacity={disabled ? 1 : 0.7} 
    style={[
      buttonStyles.primaryButtonOuter,
      disabled && { shadowOpacity: 0, elevation: 0 } // Remove shadow when disabled
    ]}
  >
    <View style={[
      buttonStyles.primaryButtonInner,
      disabled && buttonStyles.primaryButtonDisabled
    ]}>
      <Text style={[
        buttonStyles.primaryButtonText,
        disabled && buttonStyles.primaryButtonTextDisabled
      ]}>
        {title}
      </Text>
    </View>
  </TouchableOpacity>
)

// --- Main CreateAccountScreen Component ---

/**
 * CreateAccountScreen component: Facilitates user account creation with form inputs
 * and social login options. It's fully responsive and handles native system UI.
 */
const CreateAccountScreen = ({ navigation }: CreateAccountScreenProps) => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signUp } = useAuth()

  // React Hook Form setup
  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      referralCode: '',
      agreedToTerms: false,
    },
    mode: 'onBlur', // Validate only when user leaves field
  })

  const agreedToTerms = watch('agreedToTerms')

  const handleBack = () => {
    navigation.goBack()
  }

  const handleLoginLink = () => {
    navigation.navigate('Login')
  }

  const onSubmit = async (data: FormData) => {
    // Check terms agreement manually since we don't show error text
    if (!data.agreedToTerms) {
      Alert.alert("Terms Required", "Please agree to the Terms & Conditions and Privacy Policy.")
      return
    }

    setLoading(true)
    try {
      const response = await signUp(data.email, data.password, data.username)
      // After sign up, the user state will change, and the navigator will handle the rest.
      if (response.error) {
        Alert.alert("Signup Failed", response.error.message)
      }
    } catch (error: any) {
      Alert.alert("An Error Occurred", error.message || "An unexpected error occurred during sign-up.")
    } finally {
      setLoading(false)
    }
  }
  const handleTermsPress = () => {
    const url = 'https://writer.zoho.com/writer/open/53hk150704f6ec4a04a6daf3dbc2214726771';
    Linking.openURL(url).catch((err: any) => {
      console.error('Failed to open Terms & Conditions:', err);
      Alert.alert('Error', 'Unable to open Terms & Conditions');
    });
  }

  const handlePrivacyPress = () => {
    const url = 'https://writer.zoho.com/writer/open/53hk186907718e93c4eb695da3fd93373d2bf';
    Linking.openURL(url).catch((err: any) => {
      console.error('Failed to open Privacy Policy:', err);
      Alert.alert('Error', 'Unable to open Privacy Policy');
    });
  }

  const handleGoogleSignUp = () => {
    // TODO: Implement Google sign-up flow
    Alert.alert("Coming Soon", "Google sign-up will be available soon!")
  }

  const handleAppleSignUp = () => {
    // TODO: Implement Apple sign-up flow
    Alert.alert("Coming Soon", "Apple sign-up will be available soon!")
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {/* Configures the native device status bar appearance */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Removed top nav section for a cleaner look */}

      {/* Main Content Block */}
      <View style={[styles.mainContentBlock, { marginTop: getResponsiveHorizontalPadding(16) }]}> 
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            You're so much closer to better sex.
          </Text>
        </View>

        {/* Input Fields */}
        <View style={styles.inputFieldsSection}>
          <Controller
            control={control}
            name="username"
            rules={{
              required: 'Username is required',
              minLength: {
                value: 2,
                message: 'Username must be at least 2 characters'
              }
            }}
            render={({ field: { onChange, value } }) => (
              <AuthInputField 
                placeholder="Username" 
                value={value} 
                onChangeText={onChange}
                error={errors.username?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
              }
            }}
            render={({ field: { onChange, value } }) => (
              <AuthInputField 
                placeholder="Email address" 
                value={value} 
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            }}
            render={({ field: { onChange, value } }) => (
          <AuthInputField
            placeholder="Password (8+ characters)"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                showPasswordToggle={true}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
            )}
          />

          <Controller
            control={control}
            name="referralCode"
            render={({ field: { onChange, value } }) => (
              <AuthInputField
                placeholder="Referral Code (Coming Soon)"
                value={value}
                onChangeText={onChange}
                error={errors.referralCode?.message}
                showPasswordToggle={false}
                onTogglePassword={() => {}}
                disabled={true} // Always disabled for now
              />
            )}
          />
        </View>

        {/* Checkbox and Terms */}
        <Controller
          control={control}
          name="agreedToTerms"
          render={({ field: { onChange, value } }) => (
        <CheckboxWithText
              isChecked={value}
              onToggle={() => onChange(!value)}
          onTermsPress={handleTermsPress}
          onPrivacyPress={handlePrivacyPress}
            />
          )}
        />

        {/* Buttons and Social Logins */}
        <View style={styles.buttonsAndSocialSection}>
          <DisablablePrimaryButton 
            title={loading ? "Creating account..." : "Create your account"} 
            onPress={handleSubmit(onSubmit)}
            disabled={!agreedToTerms || loading}
          />
         <View style={styles.loginPrompt}>
           <Text style={styles.loginPromptText}>Already have an account? </Text>
           <TouchableOpacity onPress={handleLoginLink} activeOpacity={0.7}>
             <Text style={styles.loginLinkText}>Log in</Text>
           </TouchableOpacity>
         </View>

          <OrDivider />

          <View style={styles.socialButtonsContainer}>
            {/* <SocialLoginButton type="google" onPress={handleGoogleSignUp} /> */}
            <SocialLoginButton type="apple" onPress={handleAppleSignUp} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

// --- Stylesheets ---

const buttonStyles = StyleSheet.create({
  primaryButtonOuter: {
    alignSelf: "stretch",
    borderRadius: 12,
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
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  primaryButtonInner: {
    flex: 1,
    paddingHorizontal: toDp(4), // 16px
    paddingVertical: toDp(3), // 12px
    backgroundColor: "#FB923C", // orange-400
    borderRadius: 12,
    borderColor: "#FB923C",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(2), // 8px
    overflow: "hidden",
  },
  primaryButtonText: {
    color: "#FFFFFF", // white
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
  primaryButtonDisabled: {
    backgroundColor: "#D1D5DB", // gray-300 for disabled state
    borderColor: "#D1D5DB",
  },
  primaryButtonTextDisabled: {
    color: "#9CA3AF", // gray-400 for disabled text
  },
})

const checkboxStyles = StyleSheet.create({
  container: {
    alignSelf: "stretch", // Ensures it takes full width if needed
    flexDirection: "row",
    alignItems: "flex-start", // Align text to top of checkbox
    gap: toDp(2.5), // 10px gap
    // Adjust width for text based on windowWidth or max width of content
    paddingRight: getResponsiveHorizontalPadding(20), // to prevent text going too wide
  },
  checkboxWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: 16, // w-4
    height: 16, // h-4
    borderRadius: 4,
    borderWidth: 1.2, // border-[1.20px]
    borderColor: "#D1D5DB", // gray-300
    backgroundColor: "#FFFFFF", // white
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#3B82F6", // blue-700 for checked state
    borderColor: "#3B82F6",
  },
  checkmark: {
    width: 8,
    height: 4,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#FFFFFF",
    transform: [{ rotate: "-45deg" }],
    marginBottom: 1,
  },
  text: {
    flex: 1, // Allow text to wrap and take available space
    color: "#4B5563", // gray-600
    fontSize: 12, // xs
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 16, // none
  },
  normalText: {
    color: "#4B5563", // gray-600
  },
  linkText: {
    color: "#2563EB", // blue-600
  },
})

const orDividerStyles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "center", // Centers "or"
    alignItems: "center",
    gap: toDp(10), // 40px gap
  },
  line: {
    flex: 1, // Lines take equal remaining space
    height: 1, // h-0, outline-1 -> 1px border
    borderColor: "#E5E7EB", // gray-100
    borderWidth: 0.5, // outline-1 / 2 for consistent visual across platforms
  },
  text: {
    color: "#64748B", // slate-500
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
})

const socialButtonStyles = StyleSheet.create({
  buttonContainer: {
    alignSelf: "stretch",
    height: 48, // h-12
    paddingHorizontal: toDp(4), // 16px
    paddingVertical: toDp(2.5), // 10px
    borderRadius: 8, // rounded-lg
    ...Platform.select({
      ios: {
        shadowColor: "rgba(16,24,40,0.05)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(3), // 12px gap
    overflow: "hidden",
  },
  googleButton: {
    backgroundColor: "#F3F4F6", // gray-100
  },
  appleButton: {
    backgroundColor: "#171717", // neutral-900
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 16,
  },
  googleText: {
    color: "#4B5563", // gray-600
  },
  appleText: {
    color: "#FFFFFF", // white
  },
  googleIcon: {
    width: 24, // w-6
    height: 24, // h-6
    position: "relative",
    overflow: "hidden",
  },
  googleIconPart: {
    width: 12, // w-3
    height: 12, // h-3
    position: "absolute",
  },
  appleIcon: {
    width: 24, // w-6
    height: 24, // h-6
    position: "relative",
    overflow: "hidden",
  },
  appleIconFill: {
    width: 20, // w-5
    height: 20, // h-5
    left: 2.7, // left-[2.70px]
    top: 0,
    position: "absolute",
    backgroundColor: "#FFFFFF", // white
  },
})

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    // alignSelf: 'stretch' will align children to the full width
  },

  topNavSection: {
    width: "100%",
    paddingHorizontal: getResponsiveHorizontalPadding(13), // Responsive horizontal padding
    marginTop: getResponsiveHorizontalPadding(20), // Top margin, accounting for status bar
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonIcon: {
    width: 8,
    height: 16,
    left: 7.9,
    top: 4.08,
    position: "absolute",
    borderColor: "#171717",
    borderWidth: 1.5,
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  loginPromptText: {
    color: "#64748B", // slate-500
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },
  loginLinkText: {
    color: "#2563EB", // blue-600
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },

  mainContentBlock: {
    flex: 1, // Allows this section to grow and take available space
    width: windowWidth - getResponsiveHorizontalPadding(20) * 2, // Content width, subtract responsive padding from both sides
    alignSelf: "center", // Centers the block horizontally
    marginTop: getResponsiveHorizontalPadding(30), // Margin from top nav
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: toDp(8), // 32px gap between header, inputs, and buttons
  },
  headerSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  title: {
    alignSelf: "stretch",
    color: "#1F2937", // gray-800
    fontSize: 20,
    fontWeight: "700", // bold
    fontFamily: "Larsseit",
    lineHeight: 28,
  },
  subtitle: {
    alignSelf: "stretch",
    color: "#64748B", // slate-500
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
    gap: toDp(4), // 16px gap between input fields
  },
  buttonsAndSocialSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(6), // 24px gap between buttons/social
  },
  socialButtonsContainer: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(3), // 12px gap
  },
})

export default CreateAccountScreen
