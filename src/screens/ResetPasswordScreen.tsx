import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Eye, EyeSlash } from 'iconsax-react-nativejs';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../../App';

type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

interface ResetPasswordScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
}

interface FormData {
  password: string;
  confirmPassword: string;
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

// Password Input Field Component
interface PasswordInputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const PasswordInputField = ({ 
  placeholder, 
  value, 
  onChangeText, 
  error, 
  isVisible, 
  onToggleVisibility 
}: PasswordInputFieldProps) => (
  <View style={inputFieldStyles.inputFieldContainer}>
    <View style={inputFieldStyles.inputFieldInner}>
      <View style={inputFieldStyles.inputFieldTextContainer}>
        <View style={inputFieldStyles.passwordInputWrapper}>
          <TextInput
            style={[
              inputFieldStyles.inputPlaceholderText,
              error ? inputFieldStyles.inputError : null
            ]}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!isVisible}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={onToggleVisibility}
            style={inputFieldStyles.eyeButton}
          >
            {isVisible ? (
              <EyeSlash size={20} color="#94A3B8" />
            ) : (
              <Eye size={20} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </View>
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

const ResetPasswordScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // React Hook Form setup for password validation
  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const password = watch('password');

  const handleBack = () => {
    // Navigate to Login as the user is effectively logged out until password is reset
    navigation.navigate('Login');
  };

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // The user is already authenticated via the PASSWORD_RECOVERY event.
      // We can now directly update the password.
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        throw updateError;
      }

      // On success, notify the user and navigate to the Login screen.
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);

    } catch (error: any) {
      console.error('Password reset failed:', error);
      Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation: Back Button */}
      <View style={styles.topNavSection}>
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
          <ArrowLeft size={24} color="#171717" />
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>

      {/* Main Content Block */}
      <View style={styles.mainContentBlock}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Create a new password that you'll remember.
          </Text>
        </View>

        {/* Input Fields */}
        <View style={styles.inputFieldsSection}>
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
              <PasswordInputField 
                placeholder="New password" 
                value={value} 
                onChangeText={onChange}
                error={errors.password?.message}
                isVisible={isPasswordVisible}
                onToggleVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
      />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match'
            }}
            render={({ field: { onChange, value } }) => (
              <PasswordInputField 
                placeholder="Confirm new password" 
                value={value} 
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                isVisible={isConfirmPasswordVisible}
                onToggleVisibility={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              />
            )}
      />
        </View>

        {/* Button */}
        <View style={styles.buttonSection}>
          <PrimaryButton 
            title={loading ? "Updating..." : "Update password"} 
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
    marginBottom: toDp(4),
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
  passwordInputWrapper: {
    position: "relative",
    alignSelf: "stretch",
  },
  inputPlaceholderText: {
    alignSelf: "stretch",
    height: 48,
    paddingHorizontal: toDp(4),
    paddingRight: 48, // Make room for eye icon
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
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 14,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
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
  spacer: {
    flex: 1,
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
    fontWeight: "400",
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

export default ResetPasswordScreen; 