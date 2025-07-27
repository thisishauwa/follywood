import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Star1 } from 'iconsax-react-native';

type TabType = 'All' | 'Horror' | 'Comedy' | 'Drama' | 'Action';

interface Studio {
  id: string;
  name: string;
  owner: string;
  genre: string;
  rating: number;
  fans: number;
  budget: number;
  rank: number;
}

const StudiosScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const studios: Studio[] = [
    {
      id: '1',
      name: 'Artistic Vision',
      owner: 'Nana Bello',
      genre: 'horror',
      rating: 2,
      fans: 12,
      budget: 30000,
      rank: 1,
    },
    {
      id: '2',
      name: 'Midnight Productions',
      owner: 'Sarah Chen',
      genre: 'horror',
      rating: 4,
      fans: 28,
      budget: 85000,
      rank: 2,
    },
    {
      id: '3',
      name: 'Laugh Track Studios',
      owner: 'Mike Johnson',
      genre: 'comedy',
      rating: 3,
      fans: 19,
      budget: 45000,
      rank: 3,
    },
    {
      id: '4',
      name: 'Epic Films',
      owner: 'David Rodriguez',
      genre: 'action',
      rating: 5,
      fans: 42,
      budget: 120000,
      rank: 4,
    },
    {
      id: '5',
      name: 'Heartstring Pictures',
      owner: 'Emma Wilson',
      genre: 'drama',
      rating: 4,
      fans: 33,
      budget: 65000,
      rank: 5,
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star1
        key={index}
        size={16}
        color={index < rating ? '#EE4C01' : '#FFE5D8'}
        variant={index < rating ? 'Bold' : 'Outline'}
      />
    ));
  };

  const filteredStudios = activeTab === 'All' 
    ? studios 
    : studios.filter(studio => studio.genre.toLowerCase() === activeTab.toLowerCase());

  const renderStudioCard = (studio: Studio) => (
    <View key={studio.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studioInfo}>
          <Text style={styles.cardTitle}>{studio.name}</Text>
          <Text style={styles.ownerText}>By {studio.owner}</Text>
        </View>
        <View style={styles.starsContainer}>
          {renderStars(studio.rating)}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.tagsContainer}>
          <View style={styles.fansBadge}>
            <Text style={styles.fansText}>{studio.fans} fans</Text>
          </View>
          <View style={styles.genreBadge}>
            <Text style={styles.genreText}>{studio.genre}</Text>
          </View>
        </View>
        <Text style={styles.budget}>${studio.budget.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Studios</Text>
          <Text style={styles.subtitle}>Connect with other producers</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['All', 'Horror', 'Comedy', 'Drama', 'Action'] as TabType[]).map((tab) => (
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

        {/* Studios List */}
        <View style={styles.content}>
          {filteredStudios.map(renderStudioCard)}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2201B2',
  },
  inactiveTab: {
    backgroundColor: '#F5F5F5',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  inactiveTabText: {
    color: '#8C8C8C',
  },
  content: {
    gap: 16,
  },
  card: {
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studioInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#343333',
  },
  ownerText: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#616060',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  fansBadge: {
    backgroundColor: '#FFE5D8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fansText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#EE4C01',
  },
  genreBadge: {
    backgroundColor: '#FFE5D8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  genreText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#EE4C01',
  },
  budget: {
    fontSize: 18,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#000000',
  },
});

export default StudiosScreen;
