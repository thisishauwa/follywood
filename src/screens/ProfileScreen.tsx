import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Edit, Calendar, Location } from 'iconsax-react-native';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  earned: boolean;
  description: string;
}

const ProfileScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Profile' | 'Stats' | 'Settings'>('Profile');

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Film',
      icon: '🎬',
      earned: true,
      description: 'Complete your first film production',
    },
    {
      id: '2',
      title: 'Profitable Year',
      icon: '💰',
      earned: true,
      description: 'End a year with positive earnings',
    },
    {
      id: '3',
      title: 'Award Winner',
      icon: '🏆',
      earned: false,
      description: 'Win your first industry award',
    },
    {
      id: '4',
      title: '5-Star Film',
      icon: '⭐',
      earned: false,
      description: 'Create a film with 5-star rating',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Profile':
        return (
          <View style={styles.profileContent}>
            {/* Studio Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <Text style={styles.profileTitle}>Studio Profile</Text>
                <TouchableOpacity style={styles.editButton}>
                  <Edit size={16} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.studioInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.profile?.full_name?.charAt(0) || 'U'}</Text>
                </View>
                <View style={styles.studioDetails}>
                  <Text style={styles.studioName}>{user?.profile?.full_name || 'User'}</Text>
                  <Text style={styles.studioGenre}>{user?.profile?.studio_name || 'Studio'}</Text>
                </View>
              </View>

              <View style={styles.bioSection}>
                <Text style={styles.bioTitle}>Bio</Text>
                <Text style={styles.bioText}>No bio set yet.</Text>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Calendar size={16} color="#8C8C8C" />
                  <Text style={styles.detailText}>Founded 2024</Text>
                </View>
                <View style={styles.detailItem}>
                  <Location size={16} color="#8C8C8C" />
                  <Text style={styles.detailText}>Los Angeles</Text>
                </View>
              </View>
            </View>

            {/* Achievements Section */}
            <View style={styles.achievementsCard}>
              <Text style={styles.achievementsTitle}>Achievements</Text>
              <View style={styles.achievementsGrid}>
                {achievements.map((achievement) => (
                  <TouchableOpacity
                    key={achievement.id}
                    style={[
                      styles.achievementBadge,
                      achievement.earned ? styles.earnedBadge : styles.unearnedBadge,
                    ]}
                  >
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <Text
                      style={[
                        styles.achievementText,
                        achievement.earned ? styles.earnedText : styles.unearnedText,
                      ]}
                    >
                      {achievement.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      case 'Stats':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Stats coming soon...</Text>
          </View>
        );
      case 'Settings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.comingSoonText}>Settings coming soon...</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['Profile', 'Stats', 'Settings'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab ? styles.activeTab : styles.inactiveTab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab ? styles.activeTabText : styles.inactiveTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 24,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#1A1A1A',
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Medium',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inactiveTabText: {
    color: '#8C8C8C',
  },
  profileContent: {
    gap: 24,
  },
  profileCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 20,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#FFFFFF',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Medium',
    color: '#FFFFFF',
  },
  studioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'BuenosAires-Bold',
    color: '#333333',
  },
  studioDetails: {
    flex: 1,
  },
  studioName: {
    fontSize: 24,
    fontFamily: 'BuenosAires-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  studioGenre: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  bioSection: {
    gap: 8,
  },
  bioTitle: {
    fontSize: 16,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#FFFFFF',
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  achievementsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  achievementsTitle: {
    fontSize: 20,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#FFFFFF',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  earnedBadge: {
    backgroundColor: '#4A3B7A',
  },
  unearnedBadge: {
    backgroundColor: '#1A1A1A',
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Medium',
    textAlign: 'center',
  },
  earnedText: {
    color: '#FFFFFF',
  },
  unearnedText: {
    color: '#8C8C8C',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoonText: {
    fontSize: 18,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
});

export default ProfileScreen;
