import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, User, TrendUp, TrendDown } from 'iconsax-react-native';

type NewsCategory = 'All' | 'Actors' | 'Films' | 'Industry' | 'Politics' | 'Gossip';

interface NewsItem {
  id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  timestamp: string;
  trending?: 'up' | 'down';
  imageUrl?: string;
  author: string;
}

const ExploreScreen = () => {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('All');

  const newsItems: NewsItem[] = [
    {
      id: '1',
      category: 'Films',
      headline: 'Midnight Productions Breaks Box Office Records',
      summary: 'Sarah Chen\'s latest thriller "Dark Waters" has earned $45M in its opening weekend, setting a new record for independent studios.',
      timestamp: '2 hours ago',
      trending: 'up',
      author: 'Follywood Reporter',
    },
    {
      id: '2',
      category: 'Actors',
      headline: 'Emma Sterling Signs Exclusive Deal with Epic Films',
      summary: 'The drama specialist has inked a three-picture deal worth $2.5M, marking the largest contract for a rising star this season.',
      timestamp: '4 hours ago',
      author: 'Industry Insider',
    },
    {
      id: '3',
      category: 'Industry',
      headline: 'Follywood Economy Sees 15% Growth This Quarter',
      summary: 'Strong performance from comedy and action genres drives market expansion. Analysts predict continued growth through awards season.',
      timestamp: '6 hours ago',
      trending: 'up',
      author: 'Market Watch',
    },
    {
      id: '4',
      category: 'Politics',
      headline: 'New Tax Incentives for Independent Studios Announced',
      summary: 'The Follywood Council has approved new legislation offering 20% tax breaks for studios producing films under $1M budget.',
      timestamp: '8 hours ago',
      author: 'Policy News',
    },
    {
      id: '5',
      category: 'Actors',
      headline: 'Ryan Goldberg Takes Break After String of Flops',
      summary: 'The action star announces hiatus following three consecutive box office disappointments. "Time to reassess and come back stronger," he says.',
      timestamp: '12 hours ago',
      trending: 'down',
      author: 'Celebrity Watch',
    },
    {
      id: '6',
      category: 'Films',
      headline: 'Horror Genre Dominates This Season\'s Releases',
      summary: 'Five of the top ten grossing films this month are horror productions, signaling a major shift in audience preferences.',
      timestamp: '1 day ago',
      trending: 'up',
      author: 'Genre Analysis',
    },
    {
      id: '7',
      category: 'Industry',
      headline: 'Climate Change Affects Outdoor Filming Locations',
      summary: 'Rising temperatures force three major productions to relocate shoots. Studios adapt with indoor alternatives and green technology.',
      timestamp: '1 day ago',
      author: 'Environmental Reporter',
    },
    {
      id: '8',
      category: 'Gossip',
      headline: 'Behind the Scenes: Studio Romance Rumors',
      summary: 'Sources close to Midnight Productions hint at a budding romance between lead actors during the filming of "Dark Waters."',
      timestamp: '3 hours ago',
      author: 'Gossip Central',
    },
    {
      id: '9',
      category: 'Gossip',
      headline: 'Director Spotted at Rival Studio\'s Premiere',
      summary: 'Christopher Newman was seen mingling with competitors at last night\'s premiere, sparking speculation about potential collaborations.',
      timestamp: '1 day ago',
      author: 'Industry Whispers',
    },
  ];

  const categories: NewsCategory[] = ['All', 'Actors', 'Films', 'Industry', 'Politics', 'Gossip'];

  const filteredNews = activeCategory === 'All' 
    ? newsItems 
    : newsItems.filter(item => item.category === activeCategory);

  const renderTrendingIcon = (trending?: 'up' | 'down') => {
    if (!trending) return null;
    
    return trending === 'up' ? (
      <TrendUp size={16} color="#22C55E" />
    ) : (
      <TrendDown size={16} color="#EF4444" />
    );
  };

  const renderNewsCard = (item: NewsItem) => (
    <TouchableOpacity key={item.id} style={styles.newsCard}>
      <View style={styles.newsHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <View style={styles.newsMetadata}>
          {renderTrendingIcon(item.trending)}
          <Clock size={14} color="#8C8C8C" />
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
      </View>
      
      <Text style={styles.headline}>{item.headline}</Text>
      <Text style={styles.summary}>{item.summary}</Text>
      
      <View style={styles.newsFooter}>
        <View style={styles.authorInfo}>
          <User size={16} color="#8C8C8C" />
          <Text style={styles.author}>{item.author}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Follywood News</Text>
          <Text style={styles.subtitle}>Stay updated with the latest industry buzz</Text>
        </View>

        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.tab,
                activeCategory === category ? styles.activeTab : styles.inactiveTab,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === category ? styles.activeTabText : styles.inactiveTabText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* News Feed */}
        <View style={styles.newsFeed}>
          {filteredNews.map(renderNewsCard)}
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
    marginBottom: 32,
  },
  tabContent: {
    paddingRight: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginRight: 8,
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
  newsFeed: {
    gap: 16,
  },
  newsCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#FFE5D8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'BuenosAires-Medium',
    color: '#EE4C01',
  },
  newsMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  headline: {
    fontSize: 16,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#333333',
    lineHeight: 22,
  },
  summary: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#616060',
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  author: {
    fontSize: 12,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
});

export default ExploreScreen;
