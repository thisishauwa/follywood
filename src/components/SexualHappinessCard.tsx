import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { Progress } from '../../components/ui/progress';
import { X, Info } from 'lucide-react-native';

// Talk to August Design System Colors
const colors = {
  gray800: "#242B33",
  gray700: "#495766", 
  gray500: "#A1AEBC",
  gray300: "#D7DCE2",
  gray100: "#F2F3F5",
  white: "#FFFFFF",
  ttaBlue500: "#2154E0",
  ttaBlue50: "#E9EEFC",
  ttaGreen500: "#57BD8B",
  ttaGreen400: "#79CAA2",
  ttaYellow500: "#F09235",
  ttaYellow400: "#F3A85D",
  ttaPink600: "#BE6BC6",
  ttaPink400: "#F4B1FA",
  black: "#000000",
  gray200: "#E5E5EA",
};

interface SexualHappinessCardProps {
  score: number;
  factors: {
    reflectionScore: number;
    progressScore: number;
    learningScore: number;
    communicationScore: number;
    consistencyBonus: number;
  };
  breakdown: {
    reflection: string;
    progress: string;
    learning: string;
    communication: string;
    consistency: string;
  };
  onRefresh?: () => void;
  onClose?: () => void;
  visible?: boolean;
}

const SexualHappinessCard: React.FC<SexualHappinessCardProps> = ({
  score,
  factors,
  breakdown,
  onRefresh,
  onClose,
  visible = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.ttaGreen500;
    if (score >= 60) return colors.ttaBlue500;
    if (score >= 40) return colors.ttaYellow500;
    return colors.ttaPink600;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };



  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Score Breakdown</Text>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={24} color={colors.gray700} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.overallScoreSection}>
            <Text style={[styles.modalScoreNumber, { color: getScoreColor(score) }]}>
              {score}%
            </Text>
            <Text style={styles.modalScoreLabel}>{getScoreLabel(score)}</Text>
            <Text style={styles.modalDescription}>
              Your score reflects your engagement with sexual wellness practices over the past 30 days.
            </Text>
          </View>

          <View style={styles.factorsSection}>
            {Object.entries(factors).map(([key, value]) => {
              const factorName = key.replace('Score', '').replace('Bonus', '');
              const capitalizedName = factorName.charAt(0).toUpperCase() + factorName.slice(1);
              
              return (
                <View key={key} style={styles.factorItem}>
                  <View style={styles.factorHeader}>
                    <View style={styles.factorTitleContainer}>
                      <Text style={styles.factorName}>{capitalizedName}</Text>
                    </View>
                    <Text style={styles.factorScore}>{Math.round(value)}/100</Text>
                  </View>
                  
                  <View style={styles.factorProgressContainer}>
                    <Progress 
                      value={value} 
                      max={100}
                      style={styles.factorProgressBar}
                      progressColor={getScoreColor(value)}
                      backgroundColor={colors.gray100}
                    />
                  </View>
                  
                  <Text style={styles.factorDescription}>
                    {breakdown[factorName as keyof typeof breakdown]}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.improvementSection}>
            <View style={styles.tipContainer}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Regular journaling, completing goals, and engaging with educational content 
                are the best ways to boost your sexual wellness score.
              </Text>
            </View>
          </View>

          {onRefresh && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshButtonText}>Refresh Score</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    lineHeight: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  overallScoreSection: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
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
  modalScoreNumber: {
    fontSize: 64,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    marginBottom: 8,
    lineHeight: 64,
  },
  modalScoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray700,
    marginBottom: 12,
    lineHeight: 24,
  },
  modalDescription: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Larsseit',
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 16,
  },
  factorsSection: {
    marginBottom: 24,
  },
  factorItem: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
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
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  factorName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Larsseit',
    color: colors.gray800,
    lineHeight: 24,
  },
  factorScore: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    color: colors.gray500,
    lineHeight: 24,
  },
  factorProgressContainer: {
    marginBottom: 8,
  },
  factorProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  factorDescription: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Larsseit',
    color: colors.gray500,
    lineHeight: 20,
  },
  improvementSection: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
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
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Larsseit',
    color: colors.gray500,
    lineHeight: 20,
  },
  refreshButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(189,95,2,1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 4,
      },
    }),
    marginBottom: 32,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Larsseit',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FB923C',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default SexualHappinessCard; 