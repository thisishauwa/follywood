"use client"

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import PropTypes from "prop-types"
import { StackNavigationProp } from '@react-navigation/stack'
import { useState, useMemo } from "react"
import { useAuth } from "../contexts/AuthContext"
import { profileService, OnboardingData } from "../services/profile"
import { ArrowLeft2, ArrowDown2 } from "iconsax-react-nativejs"
import Toast from 'react-native-toast-message';

// Navigation types
type RootStackParamList = {
  GettingStarted: undefined;
  AboutYou: undefined;
  Home: undefined;
}

type AboutYouScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AboutYou'>

interface AboutYouScreenProps {
  navigation: AboutYouScreenNavigationProp;
}

// --- Utilities ---
const { width: windowWidth } = Dimensions.get("window")
const toDp = (value: number): number => value * 4
const getResponsiveHorizontalPadding = (originalPx: number): number => {
  const originalDesignWidth = 384
  return (originalPx / originalDesignWidth) * windowWidth
}

// --- Data ---
const AGE_RANGES = ['16-20', '21-25', '26-30', '31-35', '36-45', '45+'];
const GENDERS = ['male', 'female', 'non-binary', 'other', 'prefer not to say'];
const SEXUALITIES = ['straight', 'gay', 'bisexual', 'pansexual', 'asexual', 'other', 'prefer not to say'];
const RELATIONSHIP_STATUSES = ['single', 'dating', 'married', 'other'];

// --- Reusable Components ---

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

const PrimaryButton = ({ title, onPress = () => {}, disabled = false }: PrimaryButtonProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[buttonStyles.primaryButtonOuter, disabled && buttonStyles.disabledButton]} disabled={disabled}>
    <View style={buttonStyles.primaryButtonInner}>
      <Text style={buttonStyles.primaryButtonText}>{title}</Text>
    </View>
  </TouchableOpacity>
)

interface PickerProps {
  items: string[];
  selectedValue: string | null;
  onValueChange: (value: string) => void;
  placeholder: string;
}

const Picker = ({ items, selectedValue, onValueChange, placeholder }: PickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={dropdownStyles.container}>
        <View style={{ flex: 1, marginRight: toDp(2) }}>
            <Text style={[dropdownStyles.text, selectedValue && dropdownStyles.selectedText]} numberOfLines={1} ellipsizeMode='tail'>
              {selectedValue || placeholder}
            </Text>
        </View>
        <ArrowDown2 size={16} color="#DCDFEF" />
      </TouchableOpacity>
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {items.map((item) => (
              <TouchableOpacity key={item} style={styles.modalItem} onPress={() => handleSelect(item)}>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// --- Main AboutYouScreen Component ---

const AboutYouScreen = ({ navigation }: AboutYouScreenProps) => {
  const { user } = useAuth()
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [gender, setGender] = useState<string | null>(null)
  const [sexuality, setSexuality] = useState<string | null>(null)
  const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null)

  const isFormComplete = useMemo(() => {
    return ageRange && gender && sexuality && relationshipStatus;
  }, [ageRange, gender, sexuality, relationshipStatus]);

  const handleBack = () => {
    navigation.goBack()
  }

  const handleContinue = async () => {
    if (!user || !isFormComplete) {
      console.error("User not found or form is incomplete.")
      return
    }

    const finalData: OnboardingData = {
      age_range: ageRange as OnboardingData['age_range'],
      gender: gender!,
      sexuality: sexuality!,
      relationship_status: relationshipStatus as OnboardingData['relationship_status'],
      onboarding_completed: true,
    }

    try {
      await profileService.updateOnboardingData(user.id, finalData);
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Your account has been created successfully.'
      });
      // Navigate to Home, replacing the current stack so user can\'t go back
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'There was a problem saving your profile. Please try again.'
      });
    }
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topNavSection}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backButton}>
            <ArrowLeft2 size={24} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.gettingStartedTitle}>Getting started</Text>
          <View style={styles.rightSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerAboveCard}>
            <Text style={styles.headerTitle}>I can do that :)</Text>
            <Text style={styles.headerSubtitle}>First, tell me a bit more about you</Text>
          </View>

          <View style={styles.mainContentCard}>
            <View style={styles.lineContainer}>
              <Text style={styles.whiteText}>I'm a</Text>
              <Picker placeholder="age range" items={AGE_RANGES} selectedValue={ageRange} onValueChange={setAgeRange} />
              <Text style={styles.whiteText}>year old</Text>
            </View>

            <View style={styles.lineContainer}>
              <Picker placeholder="gender" items={GENDERS} selectedValue={gender} onValueChange={setGender} />
              <Text style={styles.whiteText}>who, you know,</Text>
            </View>

            <View style={styles.lineContainer}>
              <Text style={styles.whiteText}>is kind of</Text>
              <Picker placeholder="sexuality" items={SEXUALITIES} selectedValue={sexuality} onValueChange={setSexuality} />
              <Text style={styles.lightWhiteText}>.</Text>
            </View>

            <View style={styles.lineContainer}>
              <Text style={styles.whiteText}>Also, I'm</Text>
              <Picker placeholder="relationship" items={RELATIONSHIP_STATUSES} selectedValue={relationshipStatus} onValueChange={setRelationshipStatus} />
              <Text style={styles.lightWhiteText}>.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <PrimaryButton title="Continue" onPress={handleContinue} disabled={!isFormComplete} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// --- Stylesheets ---

const buttonStyles = StyleSheet.create({
  primaryButtonOuter: {
    alignSelf: "stretch",
    borderRadius: 12,
    flexDirection: 'row',
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
  },
  primaryButtonInner: {
    flex: 1,
    paddingHorizontal: toDp(4),
    paddingVertical: toDp(3),
    backgroundColor: "#FB923C",
    borderRadius: 12,
    borderColor: "#FB923C",
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
})

const dropdownStyles = StyleSheet.create({
  container: {
    height: 40,
    paddingHorizontal: toDp(3),
    backgroundColor: "#818CF8",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1, // Allow the picker to grow to fill available space
    minWidth: 120, // Ensure it doesn't become too small
  },
  text: {
    color: "#DCDFEF",
    fontSize: 24,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 32,
  },
  selectedText: {
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
})

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: getResponsiveHorizontalPadding(20),
  },
  topNavSection: {
    width: "100%",
    paddingHorizontal: getResponsiveHorizontalPadding(13),
    paddingTop: getResponsiveHorizontalPadding(20),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 24,
    height: 24,
  },
  gettingStartedTitle: {
    flex: 1,
    textAlign: "center",
    color: "#171717",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 24,
  },
  rightSpacer: {
    width: 24,
    height: 24,
  },
  headerAboveCard: {
    alignItems: "center",
    gap: toDp(1),
    marginBottom: toDp(4), // Reduced margin to bring card closer
  },
  headerTitle: {
    color: "#1F2937",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Larsseit",
    lineHeight: 32,
  },
  headerSubtitle: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 18,
  },
  mainContentCard: {
    padding: toDp(5),
    backgroundColor: "#6366F1",
    borderRadius: 20,
    gap: toDp(4), // Increased gap between lines for clarity
  },
  lineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: toDp(2),
    flexWrap: "wrap",
  },
  whiteText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 32,
  },
  lightWhiteText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "500",
    fontFamily: "Larsseit",
    lineHeight: 28,
  },
  buttonContainer: {
    paddingHorizontal: getResponsiveHorizontalPadding(20),
    paddingBottom: Platform.OS === 'ios' ? toDp(5) : toDp(4),
    paddingTop: toDp(4),
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: toDp(5),
    width: '80%',
    maxHeight: '60%',
  },
  modalItem: {
    paddingVertical: toDp(3),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemText: {
    fontSize: 18,
    textAlign: 'center',
  },
})

export default AboutYouScreen
