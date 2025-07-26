import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRight2 } from 'iconsax-react-nativejs';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const colors = {
  gray900: '#1A1F24',
  gray800: '#242B33',
  gray700: '#495766',
  gray500: '#A1AEBC',
  gray300: '#D7DCE2',
  gray100: '#F2F3F5',
  gray50: '#F8FAFC',
  white: '#FFFFFF',
  ttaBlue500: '#2154E0',
  ttaBlue50: '#E9EEFC',
  black: '#000000',
  green500: '#22C55E',
  orange500: '#FB923C',
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

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'pending' | 'cancelled' | 'incomplete' | 'past_due';
  created_at: string;
  start_date: string;
  end_date: string | null;
  next_payment_date: string;
  cancelled_at: string | null;
  subscription_plans: SubscriptionPlan;
}

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    checkUserSubscription();
  }, [user]);

  const checkUserSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .in('status', ['active', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const subscription = data as Subscription;

        if (subscription.status === 'cancelled') {
          const endDate = subscription.end_date || subscription.next_payment_date;
          const now = new Date();
          const subscriptionEndDate = new Date(endDate);

          if (now >= subscriptionEndDate) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
            return;
          }
        }

        setActiveSubscription(subscription);
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (err) {
      console.error('Error fetching user subscription:', err);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? Your premium access will continue until the end of the current billing period.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const { error } = await supabase.functions.invoke('cancel-subscription', {
                body: { subscriptionId: activeSubscription.id },
              });

              if (error) throw error;

              await checkUserSubscription();

              Alert.alert(
                'Subscription Cancelled',
                'Your subscription has been cancelled. You can continue to enjoy premium features until the end of your current billing period.'
              );
            } catch (err: any) {
              console.error('Error cancelling subscription:', err);
              Alert.alert('Error', err.message || 'Could not cancel your subscription. Please contact support.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { text: 'Active', color: '#248A58' };
      case 'cancelled':
        return { text: 'Cancelled', color: '#EC5E45' };
      default:
        return { text: status.charAt(0).toUpperCase() + status.slice(1), color: '#248A58' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.gray800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ttaBlue500} />
          <Text style={styles.loadingText}>Loading your subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeSubscription) {
    return null;
  }

  const { subscription_plans: plan } = activeSubscription;
  const membershipType = plan.interval === 'yearly' ? 'annual' : plan.interval === 'weekly' ? 'weekly' : 'monthly';
  const statusDisplay = getStatusDisplay(activeSubscription.status);
  const isCancelled = activeSubscription.status === 'cancelled';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ArrowLeft size={24} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.subtitle}>
              You're a <Text style={styles.subtitleBold}>{membershipType} member</Text> of the cool kids club!
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.itemsGroup}>
              <View style={styles.itemContainer}>
                <Text style={styles.itemLabel}>Plan</Text>
                <Text style={styles.itemValue}>{plan.name}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.itemContainer}>
                <Text style={styles.itemLabel}>Status</Text>
                <Text style={[styles.itemValue, { color: statusDisplay.color, fontWeight: '600' }]}>
                  {statusDisplay.text}
                </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.itemContainer}>
                <Text style={styles.itemLabel}>Subscribed On</Text>
                <Text style={styles.itemValue}>{formatDate(activeSubscription.start_date)}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.itemContainer}>
                <Text style={styles.itemLabel}>
                  {isCancelled ? 'Access Until' : 'Next Renewal'}
                </Text>
                <Text style={styles.itemValue}>
                  {formatDate(isCancelled ? (activeSubscription.end_date || activeSubscription.next_payment_date) : activeSubscription.next_payment_date)}
                </Text>
              </View>
            </View>
          </View>

          {!isCancelled && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Manage</Text>
              <View style={styles.itemsGroup}>
                <TouchableOpacity
                  style={styles.itemContainer}
                  onPress={handleCancelSubscription}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#EC5E45" />
                  ) : (
                    <Text style={[styles.itemLabel, styles.destructiveText]}>Cancel Subscription</Text>
                  )}
                  <ArrowRight2 size={20} color={'#EC5E45'} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cancellationPolicyText}>
                If you cancel, you can still enjoy premium benefits until your next renewal date.
              </Text>
            </View>
          )}

          {isCancelled && (
            <View style={styles.cancelledNotice}>
              <Text style={styles.cancelledNoticeText}>
                Your subscription has been cancelled. You can continue to enjoy premium features until the end of your current billing period.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
  },
  headerSpacer: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray500,
    fontFamily: 'Larsseit',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  container: {
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Larsseit',
    color: colors.gray500,
    lineHeight: 24,
    textAlign: 'center',
  },
  subtitleBold: {
    fontFamily: 'Larsseit-Bold',
    fontWeight: '600',
    color: colors.gray800,
  },
  sectionContainer: {
    gap: 12,
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#495766',
    fontSize: 16,
    fontFamily: 'Larsseit-Medium',
    fontWeight: '500',
    paddingLeft: 4,
  },
  itemsGroup: {
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    minHeight: 60,
  },
  itemLabel: {
    color: '#495766',
    fontSize: 16,
    fontFamily: 'Larsseit-Medium',
    fontWeight: '500',
  },
  itemValue: {
    color: colors.gray900,
    fontSize: 16,
    fontFamily: 'Larsseit',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E8EC',
    marginLeft: 20,
  },
  destructiveText: {
    color: '#EC5E45',
  },
  cancellationPolicyText: {
    marginTop: 8,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: colors.gray500,
    lineHeight: 20,
    textAlign: 'left',
  },
  cancelledNotice: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F87171',
  },
  cancelledNoticeText: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: '#DC2626',
    lineHeight: 20,
  },
});

export default SubscriptionScreen;
