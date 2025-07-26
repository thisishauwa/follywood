import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ArrowLeft, Eye, EyeSlash } from "iconsax-react-nativejs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import AuthInputField from "../components/AuthInputField";

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const hasLettersAndNumbers = (password: string): boolean => {
  const hasNumber = /\d/;
  const hasLetter = /[a-zA-Z]/;
  return hasNumber.test(password) && hasLetter.test(password);
};

const EditPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Track if the form is valid to enable/disable the save button
  const [isFormValid, setIsFormValid] = useState(false);

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // Validate the form whenever password data changes
  useEffect(() => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    const isValid =
      currentPassword.length > 0 &&
      newPassword.length >= 6 &&
      newPassword === confirmPassword;

    setIsFormValid(isValid);
  }, [passwordData]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to update your password.");
      return;
    }

    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
      return;
    }

    console.log("🔄 Starting password update process...");

    try {
      setSaving(true);
      console.log("✅ Set saving state to true");

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        console.error("❌ Password update error:", error);
        throw error;
      }

      console.log("✅ Password updated successfully");
      Alert.alert("Success", "Password updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("❌ Error updating password:", error);
      Alert.alert(
        "Error",
        `Failed to update password: ${error?.message || "Unknown error"}`
      );
    } finally {
      console.log("🔄 Setting saving state to false");
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Current Password */}
          <View style={styles.inputFieldContainer}>
            <Text style={styles.inputLabel}>Current password</Text>
            <AuthInputField
              placeholder="Enter your current password"
              value={passwordData.currentPassword}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, currentPassword: text })
              }
              secureTextEntry={!isCurrentPasswordVisible}
              showPasswordToggle={true}
              onTogglePassword={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
            />
          </View>

          {/* New Password */}
          <View style={styles.inputFieldContainer}>
            <Text style={styles.inputLabel}>New password</Text>
            <AuthInputField
              placeholder="Enter new password"
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, newPassword: text })
              }
              secureTextEntry={!isNewPasswordVisible}
              showPasswordToggle={true}
              onTogglePassword={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
            />
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputFieldContainer}>
            <Text style={styles.inputLabel}>Confirm password</Text>
            <AuthInputField
              placeholder="Confirm your password"
              value={passwordData.confirmPassword}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, confirmPassword: text })
              }
              secureTextEntry={!isConfirmPasswordVisible}
              showPasswordToggle={true}
              onTogglePassword={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            />
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password requirements:</Text>
            <Text
              style={[
                styles.requirementText,
                passwordData.newPassword.length >= 6
                  ? { color: "#57BD8B" }
                  : { color: "#666" },
              ]}
            >
              • At least 6 characters long
            </Text>
            <Text
              style={[
                styles.requirementText,
                hasLettersAndNumbers(passwordData.newPassword)
                  ? { color: "#57BD8B" }
                  : { color: "#666" },
              ]}
            >
              • Mix of letters and numbers
            </Text>
            <Text
              style={[
                styles.requirementText,
                passwordData.newPassword === passwordData.confirmPassword &&
                  passwordData.confirmPassword.length > 0
                  ? { color: "#57BD8B" }
                  : { color: "#666" },
              ]}
            >
              • Passwords must match
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          style={[
            styles.primaryButtonOuter,
            !isFormValid && styles.disabledButton,
          ]}
          disabled={saving || !isFormValid}
        >
          <View
            style={[
              styles.primaryButtonInner,
              !isFormValid && styles.disabledButtonInner,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isFormValid ? "Update password" : "Complete all fields"}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // colors.gray100
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB', // colors.gray50
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: '#1F2937', // colors.gray800
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  inputFieldContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#495766",
    marginBottom: 8,
    fontFamily: "Larsseit",
  },
  requirementsContainer: {
    marginTop: 8,
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: "Larsseit-Medium",
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: "Larsseit",
    color: "#666",
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
    marginTop: 10,
  },
  primaryButtonOuter: {
    height: 52,
    backgroundColor: "#BD5F02",
    borderRadius: 12,
    width: "100%",
    marginTop: 24,
  },
  primaryButtonInner: {
    flex: 1,
    backgroundColor: "#F09235",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -4 }],
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Larsseit-Bold",
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
    opacity: 0.7,
  },
  disabledButtonInner: {
    backgroundColor: "#E5E7EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default EditPasswordScreen;
