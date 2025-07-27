import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Edit, Calendar, Location, ArrowLeft, Logout } from 'iconsax-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  earned: boolean;
  description: string;
}

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Content */}
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

          {/* Statistics Card */}
          <View style={styles.statisticsCard}>
            <Text style={styles.statisticsTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Films Produced</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>$2.4M</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.2</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>85%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
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

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Logout size={20} color="#EE4C01" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#333333',
  },
  headerSpacer: {
    width: 40,
  },

  profileContent: {
    gap: 24,
  },
  profileCard: {
    backgroundColor: '#F7F7F7',
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
    color: '#333333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EE4C01',
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
    color: '#333333',
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
    color: '#333333',
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
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  achievementsTitle: {
    fontSize: 20,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#333333',
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
    backgroundColor: '#FFE5D8',
  },
  unearnedBadge: {
    backgroundColor: '#E5E5E5',
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
    color: '#EE4C01',
  },
  unearnedText: {
    color: '#8C8C8C',
  },
  statisticsCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  statisticsTitle: {
    fontSize: 20,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#333333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'BuenosAires-Bold',
    color: '#EE4C01',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Medium',
    color: '#EE4C01',
  },
});

export default ProfileScreen;
