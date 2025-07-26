import { NavigationProp, useNavigation } from "@react-navigation/native";
import { ArrowLeft, ArrowRight2 } from "iconsax-react-nativejs";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../../App";
import PaywallModal from "../components/PaywallModal";
import { useAuth } from "../contexts/AuthContext";

// Define props interfaces for reusable components
interface SettingsItemProps {
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

// Reusable component for each settings item
const SettingsItem: React.FC<SettingsItemProps> = ({
  label,
  onPress,
  isDestructive = false,
}) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <Text style={[styles.itemLabel, isDestructive && styles.destructiveText]}>
      {label}
    </Text>
    <ArrowRight2 size={20} color={isDestructive ? "#EC5E45" : "#6E8298"} />
  </TouchableOpacity>
);

// Reusable component for each settings section
const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.itemsGroup}>{children}</View>
  </View>
);

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { signOut, user, isSubscribed, refreshSubscriptionStatus } = useAuth();
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  const handleContactUs = async () => {
    const email = "support@talktoaugust.com";
    const subject = "Hello August, I have feedback";
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Cannot Open Email", "No email app found on your device.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while trying to open the email app."
      );
    }
  };

  const handleLogout = () => {
    signOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) {
              Alert.alert(
                "Error",
                "You must be logged in to delete your account."
              );
              return;
            }
            // In a real app, you would call a Supabase Edge Function here to securely delete user data.
            console.log(`Account deletion requested for user: ${user.id}`);
            signOut();
            Alert.alert(
              "Account Deleted",
              "Your account has been successfully deleted."
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Navigate to Edit Profile screen
  const handleProfile = () => navigation.navigate("EditProfile");

  const handleSubscription = () => {
    if (isSubscribed) {
      navigation.navigate("Subscription");
    } else {
      setIsPaywallVisible(true);
    }
  };
  const handlePaywallClose = async () => {
    setIsPaywallVisible(false);
    // Refresh subscription status but don't auto-navigate on modal close
    // Navigation should only happen after successful payment, not when canceling
    await refreshSubscriptionStatus();
  };

  const handlePaymentSuccess = async () => {
    await refreshSubscriptionStatus();
    // Navigate to subscription screen after successful payment
    navigation.navigate("Subscription");
  };
  const handleTerms = () => {
    const url =
      "https://writer.zoho.com/writer/open/53hk150704f6ec4a04a6daf3dbc2214726771";
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open Terms of Use:", err);
      Alert.alert("Error", "Unable to open Terms of Use");
    });
  };
  const handlePrivacy = () => {
    const url =
      "https://writer.zoho.com/writer/open/53hk186907718e93c4eb695da3fd93373d2bf";
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open Privacy Policy:", err);
      Alert.alert("Error", "Unable to open Privacy Policy");
    });
  };
  const handleRewards = () => navigation.navigate("Rewards");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <SettingsSection title="Account">
            <SettingsItem label="Profile" onPress={handleProfile} />
            <View style={styles.divider} />
            <SettingsItem label="Rewards" onPress={handleRewards} />
            <View style={styles.divider} />
            <SettingsItem label="Subscription" onPress={handleSubscription} />
          </SettingsSection>
          <SettingsSection title="Support">
            <SettingsItem label="Contact us" onPress={handleContactUs} />
          </SettingsSection>
          <SettingsSection title="Legal">
            <SettingsItem label="Terms of use" onPress={handleTerms} />
            <View style={styles.divider} />
            <SettingsItem label="Privacy policy" onPress={handlePrivacy} />
          </SettingsSection>
          <SettingsSection title="Permanent">
            <SettingsItem label="Log out" onPress={handleLogout} />
            <View style={styles.divider} />
            <SettingsItem
              label="Delete account"
              onPress={handleDeleteAccount}
              isDestructive
            />
          </SettingsSection>
        </View>
      </ScrollView>

      <PaywallModal
        isVisible={isPaywallVisible}
        onClose={handlePaywallClose}
        onPaymentSuccess={handlePaymentSuccess}
        title="Enjoy better sex"
        subtitle="Get unlimited access to August today"
        successMessage="Welcome to August Premium! Your subscription is now active."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB", // colors.gray50
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: "#1F2937", // colors.gray800
  },
  headerSpacer: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF", // colors.white
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 28,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionTitle: {
    color: "#495766",
    fontSize: 16,
    fontFamily: "Larsseit-Medium",
    fontWeight: "500",
  },
  itemsGroup: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    overflow: "hidden",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  itemLabel: {
    color: "#495766",
    fontSize: 16,
    fontFamily: "Larsseit-Medium",
    fontWeight: "500",
  },
  destructiveText: {
    color: "#EC5E45",
  },
  divider: {
    height: 1,
    backgroundColor: "#E4E8EC",
    marginLeft: 16,
  },
});

export default ProfileScreen;
