import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Eye, EyeSlash } from 'iconsax-react-nativejs';

const { width: windowWidth } = Dimensions.get("window")
const toDp = (value: number): number => value * 4

interface AuthInputFieldProps {
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  disabled?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoComplete?: 'email' | 'password' | 'off';
  textContentType?: 'emailAddress' | 'password' | 'none';
  autoCorrect?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}

const AuthInputField = ({ 
  placeholder, 
  secureTextEntry = false, 
  value, 
  onChangeText, 
  error,
  showPasswordToggle = false,
  onTogglePassword,
  disabled = false,
  keyboardType = 'default',
  autoComplete = 'off',
  textContentType = 'none',
  autoCorrect = false,
  autoCapitalize = 'none',
  maxLength
}: AuthInputFieldProps) => (
  <View style={inputFieldStyles.inputFieldContainer}>
    <View style={inputFieldStyles.inputFieldInner}>
      <View style={inputFieldStyles.inputFieldTextContainer}>
        <View style={inputFieldStyles.inputWrapper}>
          <TextInput
            style={[
              inputFieldStyles.inputPlaceholderText,
              showPasswordToggle ? inputFieldStyles.inputWithToggle : null,
              error ? inputFieldStyles.inputError : null,
              disabled && inputFieldStyles.inputDisabled
            ]}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoComplete={autoComplete}
            textContentType={textContentType}
            autoCorrect={autoCorrect}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            editable={!disabled}
          />
          {showPasswordToggle && (
            <TouchableOpacity 
              onPress={onTogglePassword}
              style={inputFieldStyles.passwordToggle}
              activeOpacity={0.7}
            >
              {secureTextEntry ? (
                <Eye size={24} color="#94A3B8" />
              ) : (
                <EyeSlash size={24} color="#94A3B8" />
              )}
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={inputFieldStyles.errorText}>{error}</Text>}
      </View>
    </View>
  </View>
);

const inputFieldStyles = StyleSheet.create({
  inputFieldContainer: {
    alignSelf: "stretch",
    flexDirection: "column",
  },
  inputFieldInner: {
    alignSelf: "stretch",
    flexDirection: "column",
    gap: toDp(1), // 4px
  },
  inputFieldTextContainer: {
    alignSelf: "stretch",
    flexDirection: "column",
    gap: toDp(1.5), // 6px
  },
  inputWrapper: {
    position: 'relative',
    alignSelf: "stretch",
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
    fontWeight: "400", // Changed from '500' to '400' for regular font weight
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
  inputWithToggle: {
    paddingRight: toDp(12),
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6', // gray-100
    color: '#9CA3AF', // gray-400
  },
  passwordToggle: {
    position: 'absolute',
    right: toDp(4),
    top: 0,
    bottom: 0,
    width: toDp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "Larsseit",
    marginTop: 4,
  },
});

export default AuthInputField; 