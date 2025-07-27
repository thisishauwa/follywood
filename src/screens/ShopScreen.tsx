import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Star1 } from 'iconsax-react-native';

type TabType = 'Scripts' | 'Actors' | 'Directors';

interface ScriptItem {
  id: string;
  title: string;
  description: string;
  genre: string;
  rating: number;
  fans: number;
  price: number;
}

interface TalentItem {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  price: number;
  availability: 'Available' | 'Busy' | 'Exclusive';
}

const ShopScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Scripts');

  const scripts: ScriptItem[] = [
    {
      id: '1',
      title: 'Laugh with Your Family',
      description: 'A meta-comedy about TV show makers in the heart of Follywood.',
      genre: 'comedy',
      rating: 2,
      fans: 12,
      price: 30000,
    },
    {
      id: '2',
      title: 'Midnight Shadows',
      description: 'A psychological thriller that keeps audiences on edge.',
      genre: 'thriller',
      rating: 4,
      fans: 28,
      price: 45000,
    },
    {
      id: '3',
      title: 'Love in Space',
      description: 'A romantic drama set aboard a space station.',
      genre: 'romance',
      rating: 3,
      fans: 19,
      price: 35000,
    },
  ];

  const actors: TalentItem[] = [
    {
      id: '1',
      name: 'Emma Sterling',
      specialty: 'Drama & Romance',
      rating: 4,
      experience: '8 years',
      price: 250000,
      availability: 'Available',
    },
    {
      id: '2',
      name: 'Ryan Goldberg',
      specialty: 'Action & Comedy',
      rating: 5,
      experience: '12 years',
      price: 400000,
      availability: 'Busy',
    },
  ];

  const directors: TalentItem[] = [
    {
      id: '1',
      name: 'Christopher Newman',
      specialty: 'Sci-Fi & Thriller',
      rating: 5,
      experience: '15 years',
      price: 500000,
      availability: 'Available',
    },
    {
      id: '2',
      name: 'Greta Goldstein',
      specialty: 'Drama & Indie',
      rating: 4,
      experience: '10 years',
      price: 350000,
      availability: 'Exclusive',
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

  const renderScriptCard = (script: ScriptItem) => (
    <View key={script.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{script.title}</Text>
        <View style={styles.starsContainer}>
          {renderStars(script.rating)}
        </View>
      </View>
      <Text style={styles.cardDescription}>{script.description}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.tagsContainer}>
          <View style={styles.fansBadge}>
            <Text style={styles.fansText}>{script.fans} fans</Text>
          </View>
          <View style={styles.genreBadge}>
            <Text style={styles.genreText}>{script.genre}</Text>
          </View>
        </View>
        <Text style={styles.price}>${script.price.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderTalentCard = (talent: TalentItem) => (
    <View key={talent.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{talent.name}</Text>
        <View style={styles.starsContainer}>
          {renderStars(talent.rating)}
        </View>
      </View>
      <Text style={styles.cardDescription}>{talent.specialty}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.tagsContainer}>
          <View style={styles.fansBadge}>
            <Text style={styles.fansText}>{talent.experience}</Text>
          </View>
          <View style={[styles.genreBadge, { backgroundColor: talent.availability === 'Available' ? '#E8F5E8' : '#FFE5D8' }]}>
            <Text style={[styles.genreText, { color: talent.availability === 'Available' ? '#2E7D2E' : '#EE4C01' }]}>
              {talent.availability}
            </Text>
          </View>
        </View>
        <Text style={styles.price}>${talent.price.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Scripts':
        return scripts.map(renderScriptCard);
      case 'Actors':
        return actors.map(renderTalentCard);
      case 'Directors':
        return directors.map(renderTalentCard);
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore talent</Text>
          <Text style={styles.subtitle}>Find scripts, actors and directors for your films.</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['Scripts', 'Actors', 'Directors'] as TabType[]).map((tab) => (
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

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
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
  },
  tab: {
    flex: 1,
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
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#343333',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  cardDescription: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#616060',
    lineHeight: 22,
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
  price: {
    fontSize: 18,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#000000',
  },
});

export default ShopScreen;
