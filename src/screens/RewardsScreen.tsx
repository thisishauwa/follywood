import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, DirectSend, Gift, Heart, Award } from 'iconsax-react-nativejs';
import { useAuth } from '../contexts/AuthContext';
import { PointsService } from '../services/points';
import { ReferralService, ReferralStats } from '../services/referrals';
import { useNavigation } from '@react-navigation/native';

// Design system colors
const colors = {
  gray800: "#242B33",
  gray700: "#495766",
  gray500: "#A1AEBC",
  gray300: "#D7DCE2",
  gray200: "#E5E5EA",
  gray100: "#F2F3F5",
  white: "#FFFFFF",
  ttaBlue500: "#2154E0",
  ttaBlue50: "#E9EEFC",
  ttaGreen500: "#57BD8B",
  ttaYellow500: "#F09235",
  ttaYellow50: "#FDF4EB",
  ttaPink600: "#BE6BC6",
  black: "#000000",
  gray50: "#F9FAFB",
};

interface RewardsScreenProps {
  navigation?: any;
}

const RewardsScreen: React.FC<RewardsScreenProps> = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [userPoints, setUserPoints] = useState<number>(0);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalPointsEarned: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchRewardsData();
    }
  }, [user?.id]);

  const fetchRewardsData = async () => {
    if (!user?.id) return;

    try {
      const [points, code, stats] = await Promise.all([
        PointsService.getUserPoints(user.id),
        ReferralService.getUserReferralCode(user.id),
        ReferralService.getReferralStats(user.id)
      ]);

      setUserPoints(points);
      setReferralCode(code || '');
      setReferralStats(stats);
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareCode = async () => {
    if (!referralCode) return;

    const message = ReferralService.generateReferralMessage(referralCode);
    
    try {
      await Share.share({
        message,
        title: 'Join me on Talk to August!',
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;

    if (Platform.OS === 'ios') {
      Clipboard.setString(referralCode);
    } else {
      // For Android, we can use the newer API
      try {
        await Clipboard.setString(referralCode);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
    
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Points Balance Card */}
        <ImageBackground 
          source={require('../../assets/images/backgroundofthepoints.png')}
          style={styles.pointsCard}
          imageStyle={styles.pointsCardBackground}
        >
          <Text style={styles.pointsBalance}>{userPoints}</Text>
          <Text style={styles.pointsSubtext}>Total points</Text>
        </ImageBackground>

        {/* Referral Code Card */}
        <View style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Text style={styles.cardTitle}>Invite friends</Text>
          </View>
          <Text style={styles.cardDescription}>
            Share your code and get 30 points when friends create their account!
          </Text>
          
          {referralCode ? (
            <>
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Your code</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{referralCode}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={handleCopyCode}
                  >
                    <Copy size={20} color={colors.gray500} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.shareButtonOuter} onPress={handleShareCode} activeOpacity={0.7}>
                <View style={styles.shareButtonInner}>
                  <DirectSend size={20} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Share code</Text>
                </View>
              </TouchableOpacity>

              {/* Referral Stats */}
              {referralStats.totalReferrals > 0 && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statsTitle}>Your Referrals</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{referralStats.totalReferrals}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{referralStats.completedReferrals}</Text>
                      <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{referralStats.totalPointsEarned}</Text>
                      <Text style={styles.statLabel}>Points Earned</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.errorText}>Unable to load referral code</Text>
          )}
        </View>

        {/* What You Can Do With Points */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>With points, you can</Text>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🎧</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureText}>
                Purchase <Text style={styles.featureTextBold}>audio guides</Text>
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>👕</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureText}>
                Get <Text style={styles.featureTextBold}>limited edition merch</Text>
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🛒</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureText}>
                Get <Text style={styles.featureTextBold}>discounts</Text> in the store
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray500,
    fontFamily: 'Larsseit',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pointsCard: {
    backgroundColor: colors.ttaYellow50,
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  pointsCardBackground: {
    borderRadius: 20,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
  },
  pointsBalance: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Larsseit',
    color: colors.white,
    marginBottom: 8,
  },
  pointsSubtext: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: colors.white,
  },
  referralCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
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
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: colors.gray500,
    marginBottom: 20,
    lineHeight: 20,
  },
  codeContainer: {
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    color: colors.gray700,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  shareButtonOuter: {
    alignSelf: "stretch",
    borderRadius: 12,
    marginBottom: 16,
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
  shareButtonInner: {
    flex: 1,
    paddingHorizontal: 16, // 16px
    paddingVertical: 12, // 12px
    backgroundColor: "#FB923C", // orange-400
    borderRadius: 12,
    borderColor: "#FB923C",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8, // 8px
    overflow: "hidden",
  },
  shareButtonText: {
    color: "#FFFFFF", // white
    fontSize: 16,
    fontWeight: "500", // medium
    fontFamily: "Larsseit",
    lineHeight: 24, // normal
  },
  statsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.ttaPink600,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Larsseit',
    color: colors.gray500,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    marginBottom: 4,
  },
  infoItemDescription: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: colors.gray500,
    lineHeight: 20,
  },
  pointsMethodsList: {
    gap: 12,
  },
  pointsMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
  },
  methodPoints: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.ttaBlue500,
    minWidth: 50,
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: colors.gray700,
    marginLeft: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Larsseit',
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 20,
  },
  features: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    marginBottom: 16,
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
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 20,
    fontWeight: '500',
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  featureText: {
    fontSize: 18,
    fontFamily: 'Larsseit',
    color: colors.gray700,
    lineHeight: 22,
  },
  featureTextBold: {
    fontSize: 18,
    fontFamily: 'Larsseit',
    fontWeight: '600',
    color: colors.gray700,
  },
});

export default RewardsScreen; 