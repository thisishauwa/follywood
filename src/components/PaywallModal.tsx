import { CloseCircle } from "iconsax-react-nativejs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { SubscriptionService } from "../services/subscription";

// Helper function for consistent spacing
const toDp = (value: number): number => value * 4;

const colors = {
  gray900: "#1A1F24",
  gray800: "#242B33",
  gray700: "#495766",
  gray500: "#A1AEBC",
  gray300: "#D7DCE2",
  gray100: "#F2F3F5",
  gray50: "#F8FAFC",
  white: "#FFFFFF",
  ttaBlue500: "#2154E0",
  ttaBlue50: "#E9EEFC",
  black: "#000000",
};

interface SubscriptionPlan {
  id: string;
  plan_code: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  is_active: boolean;
}

type FeatureType = "chat" | "audio_guides" | "store_discounts" | "general";

interface PaywallModalProps {
  isVisible: boolean;
  onClose: () => void;
  featureType?: FeatureType;
  title?: string;
  subtitle?: string;
  successMessage?: string;
  onPaymentSuccess?: () => void;
}

const getContextualContent = (featureType: FeatureType) => {
  switch (featureType) {
    case "chat":
      return {
        title: "Unlimited conversations",
        subtitle:
          "Get unlimited access to August AI for personalized guidance and support anytime you need it.",
      };
    case "audio_guides":
      return {
        title: "Unlimited audio guides",
        subtitle:
          "Access our complete library of personalized audio guides for your wellness journey.",
      };
    case "store_discounts":
      return {
        title: "Exclusive discounts",
        subtitle:
          "Unlock exclusive discounts on wellness products and items in our store.",
      };
    case "general":
    default:
      return {
        title: "Unlock premium",
        subtitle:
          "Unlock premium features and get personalized guidance for your sexual wellness journey.",
      };
  }
};

const PaywallModal: React.FC<PaywallModalProps> = ({
  isVisible,
  onClose,
  featureType = "general",
  title,
  subtitle,
  successMessage = "Your subscription is being processed and will be active shortly.",
  onPaymentSuccess,
}) => {
  const { user } = useAuth();

  // Get contextual content based on feature type, with custom overrides
  const contextualContent = getContextualContent(featureType);
  const displayTitle = title || contextualContent.title;
  const displaySubtitle = subtitle || contextualContent.subtitle;

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [trialEnabled, setTrialEnabled] = useState(false);
  const [isEligibleForTrial, setIsEligibleForTrial] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const paymentCallbackUrl = useMemo(
    () => "https://talktoaugust.com/payment/success",
    []
  );
  const paymentCancelUrl = useMemo(
    () => "https://talktoaugust.com/payment/cancel",
    []
  );

  useEffect(() => {
    if (isVisible) {
      fetchSubscriptionPlans();
      checkTrialEligibility();
    } else {
      setPaymentUrl(null);
      setProcessing(false);
    }
  }, [isVisible]);

  // Reset selected plan when trial toggle changes
  useEffect(() => {
    if (selectedPlan) {
      const availablePlans = getAvailablePlans();
      const isSelectedPlanStillAvailable = availablePlans.some(
        (plan) => plan.id === selectedPlan.id
      );

      if (!isSelectedPlanStillAvailable) {
        // Default to monthly plan if current selection is not available
        const monthlyPlan = availablePlans.find(
          (plan) => plan.interval === "monthly"
        );
        setSelectedPlan(monthlyPlan || availablePlans[0] || null);
      }
    }
  }, [trialEnabled]);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("amount", { ascending: true });

      if (error) throw error;

      const fetchedPlans = data || [];
      // Filter out the special offer plan from regular selection
      const regularPlans = fetchedPlans.filter(
        (plan) => plan.name !== "Weekly Special Offer"
      );
      setPlans(regularPlans);

      const yearlyPlan = regularPlans.find(
        (plan) => plan.interval === "yearly"
      );
      setSelectedPlan(yearlyPlan || regularPlans[0] || null);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      Alert.alert(
        "Error",
        "Failed to load subscription plans. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const checkTrialEligibility = async () => {
    if (!user) return;
    try {
      const eligible = await SubscriptionService.isEligibleForSpecialOffer(
        user.id
      );
      console.log(
        `[PaywallModal] User ${user.id} trial eligibility: ${eligible}`
      );
      setIsEligibleForTrial(eligible);

      // CRITICAL: If user is not eligible, ensure trial toggle is disabled
      if (!eligible) {
        console.log(
          "[PaywallModal] User not eligible for trial, disabling trial toggle"
        );
        setTrialEnabled(false);
      }
    } catch (error) {
      console.error("Error checking trial eligibility:", error);
      // On error, assume not eligible for safety
      setIsEligibleForTrial(false);
      setTrialEnabled(false);
    }
  };

  const getAvailablePlans = (): SubscriptionPlan[] => {
    // For new users: hide weekly plan when trial toggle is off
    // Check if user is a new user by checking if they're eligible for trial
    if (isEligibleForTrial && !trialEnabled) {
      // New user with trial toggle off - filter out weekly plan
      return plans.filter((plan) => plan.interval !== "weekly");
    }
    // Otherwise show all plans
    return plans;
  };

  const formatPrice = (amount: number, currency: string, interval: string) => {
    let displayAmountInNaira = amount / 100;
    let intervalText;

    if (interval === "weekly") {
      intervalText = "/WK";
    } else if (interval === "yearly") {
      intervalText = "/MO";
      // Ensure annual plan shows correct pricing (₦15,000/year = ₦1,250/month)
      displayAmountInNaira = 15000 / 12; // Force correct annual pricing
    } else {
      intervalText = "/MO";
    }

    return `₦${Math.round(
      displayAmountInNaira
    ).toLocaleString()}${intervalText}`;
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return;

    setProcessing(true);
    try {
      let planToUse = selectedPlan;

      // CRITICAL: Only use trial plan if user is eligible AND trial is enabled AND user explicitly selected it
      if (trialEnabled && isEligibleForTrial) {
        console.log(
          "[PaywallModal] Trial enabled and user eligible, using trial plan"
        );
        // Use the special offer plan for trial
        const trialPlan = await SubscriptionService.getWeeklySpecialOfferPlan();
        if (!trialPlan) {
          console.error(
            "[PaywallModal] Trial plan not found, using selected plan instead"
          );
          planToUse = selectedPlan;
        } else {
          planToUse = trialPlan;
        }
      } else {
        console.log(
          "[PaywallModal] Using selected plan directly:",
          selectedPlan.name,
          selectedPlan.interval
        );
        planToUse = selectedPlan;
      }

      const { data, error } = await supabase.functions.invoke(
        "initialize-payment",
        {
          body: {
            planId: planToUse.id,
            callbackUrl: paymentCallbackUrl,
            cancelUrl: paymentCancelUrl,
            ...(trialEnabled && { originalPlanId: selectedPlan.id }),
          },
        }
      );

      if (error) throw error;

      if (data.authorizationUrl) {
        setPaymentUrl(data.authorizationUrl);
      } else {
        throw new Error("Failed to get payment authorization URL.");
      }
    } catch (error: any) {
      Alert.alert(
        "Payment Error",
        error.message || "Could not initiate payment. Please try again."
      );
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentUrl(null);
    setProcessing(false);
    Alert.alert("Payment Successful!", successMessage, [
      {
        text: "OK",
        onPress: () => {
          onPaymentSuccess?.();
          onClose();
        },
      },
    ]);
  };

  const handlePaymentCancel = () => {
    setPaymentUrl(null);
    setProcessing(false);
  };

  const handleNavigationStateChange = (state: { url: string }) => {
    const { url } = state;
    if (!url) return;

    if (
      url.includes(paymentCallbackUrl) ||
      url.includes("standard.paystack.co/close")
    ) {
      handlePaymentSuccess();
    } else if (url.includes(paymentCancelUrl)) {
      handlePaymentCancel();
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const isYearly = plan.interval === "yearly";

    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planCard, isSelected && styles.selectedPlanCard]}
        onPress={() => setSelectedPlan(plan)}
      >
        <View style={styles.planHeader}>
          <View style={styles.planNameContainer}>
            <Text
              style={[styles.planName, isSelected && styles.selectedPlanText]}
            >
              {plan.name}
            </Text>
            {isYearly && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save 17%</Text>
              </View>
            )}
          </View>
          <View style={styles.planPricing}>
            <Text
              style={[styles.planPrice, isSelected && styles.selectedPlanText]}
            >
              {formatPrice(plan.amount, plan.currency, plan.interval)}
            </Text>
            {isYearly && (
              <Text
                style={[
                  styles.yearlyPriceText,
                  isSelected && styles.selectedPlanSubtext,
                ]}
              >
                Billed as ₦15,000/year
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (paymentUrl) {
    return (
      <Modal visible={isVisible} animationType="slide">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Complete Payment</Text>
            <TouchableOpacity
              onPress={handlePaymentCancel}
              style={styles.closeButton}
            >
              <CloseCircle size={28} color={colors.gray500} />
            </TouchableOpacity>
          </View>
          <WebView
            ref={webviewRef}
            source={{ uri: paymentUrl }}
            style={{ flex: 1 }}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                color={colors.ttaBlue500}
                style={StyleSheet.absoluteFill}
              />
            )}
          />
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Get August+</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseCircle size={28} color={colors.gray500} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.ttaBlue500} />
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.container}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{displayTitle}</Text>
                  <Text style={styles.subtitle}>{displaySubtitle}</Text>
                </View>

                <View style={styles.features}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureEmoji}>💬</Text>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureText}>
                        Unlimited conversations with{" "}
                        <Text style={styles.featureTextBold}>August AI</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureEmoji}>🎧</Text>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureText}>
                        <Text style={styles.featureTextBold}>Personalised</Text>{" "}
                        audio guides
                      </Text>
                    </View>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureEmoji}>🛒</Text>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureText}>
                        <Text style={styles.featureTextBold}>
                          Exclusive discounts
                        </Text>{" "}
                        on store items
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Trial toggle - only show if user is eligible */}
                {isEligibleForTrial && (
                  <View style={styles.trialToggleContainer}>
                    <Text style={styles.trialToggleText}>
                      Not sure? Try for a week.
                    </Text>
                    <Switch
                      value={trialEnabled}
                      onValueChange={setTrialEnabled}
                      trackColor={{
                        false: colors.gray300,
                        true: colors.ttaBlue500,
                      }}
                      thumbColor={colors.white}
                    />
                  </View>
                )}

                {/* 'Then continue' divider - only show for eligible users */}
                {isEligibleForTrial && (
                  <View style={styles.thenContinueDivider}>
                    <View style={styles.thenContinueLine} />
                    <Text style={styles.thenContinueText}>Then continue</Text>
                    <View style={styles.thenContinueLine} />
                  </View>
                )}

                <View style={styles.plansContainer}>
                  {getAvailablePlans().map(renderPlanCard)}
                </View>
              </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.primaryButtonOuter,
                  !selectedPlan && styles.disabledButton,
                ]}
                onPress={handleSubscribe}
                disabled={!selectedPlan || processing}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.primaryButtonInner,
                    !selectedPlan && styles.primaryButtonDisabled,
                  ]}
                >
                  {processing ? (
                    <Text style={styles.primaryButtonText}>Processing...</Text>
                  ) : (
                    <Text
                      style={[
                        styles.primaryButtonText,
                        !selectedPlan && styles.primaryButtonTextDisabled,
                      ]}
                    >
                      {trialEnabled
                        ? "Start ₦500 weekly trial"
                        : "Continue to payment"}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
  },
  headerSpacer: { width: 40 },
  closeButton: { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 32 },
  container: { padding: 20 },
  titleContainer: { alignItems: "center", marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Larsseit",
    color: colors.gray500,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  plansContainer: { marginBottom: 16 },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
    position: "relative",
    justifyContent: "center",
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  selectedPlanCard: {
    borderColor: colors.ttaBlue500,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  planNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Larsseit",
    color: colors.gray800,
    marginBottom: 2,
  },
  selectedPlanText: { color: colors.ttaBlue500 },
  planPricing: { alignItems: "flex-end" },
  planPrice: {
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Larsseit",
    color: colors.gray700,
  },
  yearlyPriceText: {
    fontSize: 12,
    fontFamily: "Larsseit",
    color: colors.gray500,
    marginTop: 2,
  },
  selectedPlanSubtext: { color: colors.ttaBlue500 },
  savingsBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ttaBlue500,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Larsseit",
    color: colors.ttaBlue500,
    textAlign: "center",
  },
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
  disabledButton: { backgroundColor: colors.gray300 },
  features: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  featureEmoji: {
    fontSize: 16,
    fontWeight: "500",
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Larsseit",
    color: colors.gray700,
    lineHeight: 19,
  },
  featureTextBold: {
    fontSize: 15,
    fontFamily: "Larsseit",
    fontWeight: "600",
    color: colors.gray700,
  },
  trialToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray300,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  trialToggleText: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Larsseit",
    color: colors.gray700,
    flex: 1,
  },
  thenContinueDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  thenContinueLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  thenContinueText: {
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Larsseit",
    color: colors.gray500,
    marginHorizontal: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Handle safe area
    backgroundColor: colors.white,
  },
});

export default PaywallModal;
