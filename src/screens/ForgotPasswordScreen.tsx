import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft } from 'iconsax-react-nativejs';
import { AuthService } from '../services/auth';

// Navigation types
type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

interface FormData {
  email: string;
}

const { width: windowWidth } = Dimensions.get('window');

// Helper function for responsive padding
const getResponsiveHorizontalPadding = (basePadding: number) => {
  const screenWidth = windowWidth;
  if (screenWidth < 375) return basePadding * 0.8; // iPhone SE
  if (screenWidth > 414) return basePadding * 1.2; // Large screens
  return basePadding;
};

// Helper function to convert design units to dp
const toDp = (designUnits: number) => designUnits * 4;

// Input Field Component
interface AuthInputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

const AuthInputField = ({ placeholder, value, onChangeText, error }: AuthInputFieldProps) => (
  <View style={inputFieldStyles.inputFieldContainer}>
    <View style={inputFieldStyles.inputFieldInner}>
      <View style={inputFieldStyles.inputFieldTextContainer}>
        <TextInput
          style={[
            inputFieldStyles.inputPlaceholderText,
            error ? inputFieldStyles.inputError : null
          ]}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        {error && <Text style={inputFieldStyles.errorText}>{error}</Text>}
      </View>
    </View>
  </View>
);

// Primary Button Component
interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const PrimaryButton = ({ title, onPress, disabled = false }: PrimaryButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={buttonStyles.primaryButtonOuter}
    disabled={disabled}
  >
    <View style={buttonStyles.primaryButtonInner}>
      <Text style={buttonStyles.primaryButtonText}>{title}</Text>
    </View>
  </TouchableOpacity>
);

// Main ForgotPasswordScreen Component
const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const [loading, setLoading] = useState(false);

  // React Hook Form setup
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      email: '',
    },
    mode: 'onBlur',
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      const response = await AuthService.resetPassword(data.email);
      
      if (response.success) {
        Alert.alert(
          'Reset Link Sent',
          'Please check your email for a password reset link. If you don\'t see it, check your spam folder.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          response.error?.message || 'Failed to send reset link. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation: Back Button & Back to Login Link */}
      <View style={styles.topNavSection}>
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
          <ArrowLeft size={24} color="#171717" />
        </TouchableOpacity>
        <View style={styles.backToLoginPrompt}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.backToLoginLinkText}>Remember password?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Block */}
      <View style={styles.mainContentBlock}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.subtitle}>
            Happens to the best of us. Enter your email to reset it.
          </Text>
        </View>

        {/* Input Field */}
        <View style={styles.inputFieldsSection}>
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
        </View>

        {/* Button */}
        <View style={styles.buttonSection}>
          <PrimaryButton 
            title={loading ? "Sending..." : "Send reset link"} 
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          />
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FB923C" />
            </View>
          )}
        </View>


      </View>
    </SafeAreaView>
  );
};

// Stylesheets
const inputFieldStyles = StyleSheet.create({
  inputFieldContainer: {
    alignSelf: "stretch",
    flexDirection: "column",
  },
  inputFieldInner: {
    alignSelf: "stretch",
    flexDirection: "column",
    gap: toDp(1),
  },
  inputFieldTextContainer: {
    alignSelf: "stretch",
    flexDirection: "column",
    gap: toDp(1.5),
  },
  inputPlaceholderText: {
    alignSelf: "stretch",
    height: 48,
    paddingHorizontal: toDp(4),
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Larsseit",
    textAlignVertical: "center",
    includeFontPadding: false,
    ...Platform.select({
      ios: {
        paddingTop: 14,
        paddingBottom: 14,
      },
      android: {
        textAlignVertical: "center",
        includeFontPadding: false,
        paddingTop: 0,
        paddingBottom: 0,
      },
    }),
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "Larsseit",
    marginTop: 4,
  },
});

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
});

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topNavSection: {
    width: "100%",
    paddingHorizontal: getResponsiveHorizontalPadding(13),
    marginTop: getResponsiveHorizontalPadding(20),
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
  backToLoginPrompt: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  backToLoginLinkText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },
  mainContentBlock: {
    flex: 1,
    width: windowWidth - getResponsiveHorizontalPadding(20) * 2,
    alignSelf: "center",
    marginTop: getResponsiveHorizontalPadding(30),
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
    gap: toDp(2),
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
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 20,
  },
  inputFieldsSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  buttonSection: {
    alignSelf: "stretch",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: toDp(3),
  },
  loadingContainer: {
    marginTop: toDp(2),
  },

});

export default ForgotPasswordScreen; 