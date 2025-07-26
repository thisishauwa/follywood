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
} from "react-native";
import { ArrowLeft, ArrowDown2 } from "iconsax-react-nativejs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { AppStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { OnboardingData } from "../services/profile";
import { profileService } from "../services/profile";

type ProfileFormData = {
  username: string;
  age_range: string;
  gender: string;
  sexuality: string;
  relationship_status: string;
  goal_preference?: OnboardingData["goal_preference"];
};

const RELATIONSHIP_OPTIONS = ["single", "dating", "married", "other"];
const AGE_OPTIONS = ["16-20", "21-25", "26-30", "31-35", "36-45", "45+"];
const GENDER_OPTIONS = ['male', 'female', 'non-binary', 'other', 'prefer not to say'];
const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  'non-binary': 'Non-binary',
  other: 'Other',
  'prefer not to say': 'Prefer not to say',
};
const SEXUALITY_OPTIONS = ['straight', 'gay', 'bisexual', 'pansexual', 'asexual', 'other', 'prefer not to say'];
const SEXUALITY_LABELS: Record<string, string> = {
  straight: 'Straight',
  gay: 'Gay',
  bisexual: 'Bisexual',
  pansexual: 'Pansexual',
  asexual: 'Asexual',
  other: 'Other',
  'prefer not to say': 'Prefer not to say',
};
const GOAL_PREF_OPTIONS: OnboardingData["goal_preference"][] = [
  "teach_me",
  "improve_sex",
  "enhance_sex",
];
const GOAL_PREF_LABELS: Record<
  NonNullable<OnboardingData["goal_preference"]>,
  string
> = {
  teach_me: "Teach me",
  improve_sex: "Improve sex",
  enhance_sex: "Enhance sex",
};

const EditProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: "",
    age_range: "",
    gender: "",
    sexuality: "",
    relationship_status: "",
    goal_preference: undefined,
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

    const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch user metadata for username
      const {
        data: { user: userData },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      // Fetch profile data from 'profiles' table (including username)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, age_range, gender, sexuality, relationship_status")
        .eq("id", user?.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") throw profileError;

      // Fetch goal preference from 'onboarding_selections' table
      const { data: selection, error: selectionError } = await supabase
        .from("onboarding_selections")
        .select("goal_preference")
        .eq("user_id", user?.id)
        .single();
      
      if (selectionError && selectionError.code !== "PGRST116") throw selectionError;

      // Update form data - prioritize username from profiles table, fallback to user_metadata
      setProfileData({
        username: profile?.username || userData?.user_metadata?.username || "",
        age_range: profile?.age_range || "",
        gender: profile?.gender?.toLowerCase() || "",
        sexuality: profile?.sexuality?.toLowerCase() || "",
        relationship_status: profile?.relationship_status?.toLowerCase() || "",
        goal_preference: selection?.goal_preference || undefined,
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to update your profile.");
      return;
    }

    console.log('🔄 Starting profile save process...');
    console.log('📊 Current profile data:', profileData);

    try {
      setSaving(true);
      console.log('✅ Set saving state to true');

      // Skip auth metadata update for now - we'll update username in profiles table instead
      console.log('👤 Skipping auth metadata update, will update username in profiles table');

      // Build the data object for updating the profile, including username and only fields with values
      const updateData: OnboardingData & { username?: string } = {};

      if (profileData.username) {
        updateData.username = profileData.username;
      }
      if (profileData.age_range) {
        updateData.age_range = profileData.age_range as any;
      }
      if (profileData.gender) {
        updateData.gender = profileData.gender;
      }
      if (profileData.sexuality) {
        updateData.sexuality = profileData.sexuality;
      }
      if (profileData.relationship_status) {
        updateData.relationship_status = profileData.relationship_status as any;
      }
      if (profileData.goal_preference) {
        updateData.goal_preference = profileData.goal_preference;
      }

      console.log('📝 Update data to be sent:', updateData);
      console.log('🔢 Number of fields to update:', Object.keys(updateData).length);

      // Only call the update service if there is data to update
      if (Object.keys(updateData).length > 0) {
        console.log('🚀 Calling profileService.updateOnboardingData...');
        await profileService.updateOnboardingData(user.id, updateData);
        console.log('✅ Profile service update completed');
      } else {
        console.log('ℹ️ No profile data to update, skipping service call');
      }

      console.log('🎉 About to show success alert');
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      Alert.alert("Error", `Failed to update profile: ${error?.message || 'Unknown error'}`);
    } finally {
      console.log('🔄 Setting saving state to false');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E7EFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.addButton}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit profile</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.input}
              value={profileData.username}
              onChangeText={(text) =>
                setProfileData({ ...profileData, username: text })
              }
              placeholder="Enter your username"
              placeholderTextColor="#A1AEBC"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Age range</Text>
            <View style={styles.selectionContainer}>
              {AGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectionChip,
                    profileData.age_range === option &&
                      styles.selectionChipSelected,
                  ]}
                  onPress={() =>
                    setProfileData({ ...profileData, age_range: option })
                  }
                >
                  <Text
                    style={[
                      styles.selectionChipText,
                      profileData.age_range === option &&
                        styles.selectionChipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.selectionContainer}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectionChip,
                    profileData.gender === option && styles.selectionChipSelected,
                  ]}
                  onPress={() =>
                    setProfileData({ ...profileData, gender: option })
                  }
                >
                  <Text
                    style={[
                      styles.selectionChipText,
                      profileData.gender === option &&
                        styles.selectionChipTextSelected,
                    ]}
                  >
                    {GENDER_LABELS[option]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Sexuality</Text>
            <View style={styles.selectionContainer}>
              {SEXUALITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectionChip,
                    profileData.sexuality === option &&
                      styles.selectionChipSelected,
                  ]}
                  onPress={() =>
                    setProfileData({ ...profileData, sexuality: option })
                  }
                >
                  <Text
                    style={[
                      styles.selectionChipText,
                      profileData.sexuality === option &&
                        styles.selectionChipTextSelected,
                    ]}
                  >
                    {SEXUALITY_LABELS[option]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Goal preference</Text>
            <View style={styles.selectionContainerTight}>
              {GOAL_PREF_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.selectionChip,
                    profileData.goal_preference === opt &&
                      styles.selectionChipSelected,
                  ]}
                  onPress={() =>
                    setProfileData({ ...profileData, goal_preference: opt })
                  }
                >
                  <Text
                    style={[
                      styles.selectionChipText,
                      profileData.goal_preference === opt &&
                        styles.selectionChipTextSelected,
                    ]}
                  >
                    {GOAL_PREF_LABELS[opt!]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Relationship status</Text>
            <View style={styles.selectionContainer}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectionChip,
                    profileData.relationship_status === option &&
                      styles.selectionChipSelected,
                  ]}
                  onPress={() =>
                    setProfileData({
                      ...profileData,
                      relationship_status: option,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.selectionChipText,
                      profileData.relationship_status === option &&
                        styles.selectionChipTextSelected,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer with Save button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          style={styles.primaryButtonOuter}
          disabled={saving}
        >
          <View style={styles.primaryButtonInner}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Save changes</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // New styles from CreateAccountScreen
  inputFieldContainer: {
    alignSelf: "stretch",
  },
  inputFieldInner: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E8EC",
  },
  
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputPlaceholderText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Larsseit",
    color: "#1E293B",
  },
  inputError: {
    borderColor: "#EF4444", // red-500
  },
  placeholderText: {
    color: "#A1AEBC",
    fontSize: 16,
    fontFamily: "Larsseit",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
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
  selectionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectionContainerTight: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  selectionChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FDF4EB",
    borderRadius: 999,
    borderWidth: 0,
  },
  selectionChipSelected: {
    backgroundColor: "#2154E0",
  },
  selectionChipText: {
    fontSize: 16,
    fontFamily: "Larsseit",
    color: "#2154E0",
    fontWeight: "500",
  },
  selectionChipTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },

  // Original styles (some may be overridden or removed)

  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6", // colors.gray100
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: "#1F2937", // colors.gray800
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB", // colors.gray50
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF", // colors.white
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    color: "#495766",
    fontSize: 16,
    fontFamily: "Larsseit-Medium",
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    color: '#64748B', // gray600
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: "#3E7EFF",
  },
  optionText: {
    color: "#495766",
    fontSize: 14,
    fontFamily: "Larsseit-Medium",
  },
  selectedOptionText: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#3E7EFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Larsseit-Bold",
    fontWeight: "700",
  },
});

export default EditProfileScreen;
