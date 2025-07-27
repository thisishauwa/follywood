import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { Star1, SearchNormal1, Add, TrendUp } from 'iconsax-react-native';
import { cinemaContentService, Actor, Director, MarketplaceScript, EntertainmentNews } from '../services/cinemaContentService';

type TabType = 'Scripts' | 'Actors' | 'Directors' | 'News';

// Using types from cinemaContentService instead of local interfaces

interface ShopScreenProps {
  route?: {
    params?: {
      leagueId?: string;
    };
  };
}

const ShopScreen = ({ route }: ShopScreenProps) => {
  const leagueId = route?.params?.leagueId || 'default-league-id';
  const [activeTab, setActiveTab] = useState<TabType>('Scripts');
  const [scripts, setScripts] = useState<MarketplaceScript[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [news, setNews] = useState<EntertainmentNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Indie'];

  useEffect(() => {
    loadData();
  }, [leagueId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scriptsData, actorsData, directorsData, newsData] = await Promise.all([
        cinemaContentService.getMarketplaceScripts(leagueId),
        cinemaContentService.getAvailableActors(leagueId),
        cinemaContentService.getAvailableDirectors(leagueId),
        cinemaContentService.getEntertainmentNews(leagueId),
      ]);
      setScripts(scriptsData);
      setActors(actorsData);
      setDirectors(directorsData);
      setNews(newsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const generateNewContent = async () => {
    const contentType = activeTab === 'Scripts' ? 'scripts' : activeTab.toLowerCase();
    Alert.alert(
      'Generate New Content',
      `This will use AI to create new ${contentType} for your league. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setLoading(true);
              if (activeTab === 'Scripts') {
                await cinemaContentService.generateScripts(leagueId, 3);
              } else if (activeTab === 'Actors') {
                await cinemaContentService.generateActors(leagueId, 2);
              } else if (activeTab === 'Directors') {
                await cinemaContentService.generateDirectors(leagueId, 1);
              } else if (activeTab === 'News') {
                await cinemaContentService.generateEntertainmentNews(leagueId);
              }
              await loadData();
              Alert.alert('Success', `New ${contentType} generated successfully!`);
            } catch (error) {
              console.error('Error generating content:', error);
              Alert.alert('Error', `Failed to generate new ${contentType}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const searchContent = async () => {
    if (!searchQuery.trim()) {
      await loadData();
      return;
    }

    try {
      setLoading(true);
      if (activeTab === 'Actors' || activeTab === 'Directors') {
        const results = await cinemaContentService.searchTalent(
          leagueId,
          searchQuery,
          activeTab === 'Actors' ? 'Actor' : 'Director'
        );
        if (activeTab === 'Actors') {
          setActors(results as Actor[]);
        } else {
          setDirectors(results as Director[]);
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Error', 'Failed to search content');
    } finally {
      setLoading(false);
    }
  };

  const filterByGenre = async (genre: string) => {
    try {
      setLoading(true);
      setSelectedGenre(genre);
      
      if (genre === '') {
        await loadData();
        return;
      }

      if (activeTab === 'Scripts') {
        const results = await cinemaContentService.filterScriptsByGenre(leagueId, genre);
        setScripts(results);
      } else if (activeTab === 'Actors' || activeTab === 'Directors') {
        const results = await cinemaContentService.filterTalentByGenre(
          leagueId,
          genre,
          activeTab === 'Actors' ? 'Actor' : 'Director'
        );
        if (activeTab === 'Actors') {
          setActors(results as Actor[]);
        } else {
          setDirectors(results as Director[]);
        }
      }
    } catch (error) {
      console.error('Error filtering by genre:', error);
      Alert.alert('Error', 'Failed to filter content');
    } finally {
      setLoading(false);
    }
  };

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

  const renderScriptCard = (script: MarketplaceScript) => (
    <View key={script.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{script.title}</Text>
        <View style={styles.starsContainer}>
          {renderStars(script.quality_stars)}
          {script.trending_score > 10 && (
            <TrendUp size={16} color="#EE4C01" style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>
      <Text style={styles.cardDescription}>{script.logline}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.tagsContainer}>
          <View style={styles.fansBadge}>
            <Text style={styles.fansText}>Buzz: {script.buzz_rating}%</Text>
          </View>
          <View style={styles.genreBadge}>
            <Text style={styles.genreText}>{script.genre}</Text>
          </View>
          <View style={styles.authorBadge}>
            <Text style={styles.authorText}>by {script.original_author}</Text>
          </View>
        </View>
        <Text style={styles.price}>${script.base_cost.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderTalentCard = (talent: Actor | Director) => (
    <View key={talent.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{talent.name}</Text>
        <View style={styles.starsContainer}>
          {renderStars(Math.floor(talent.star_power_rating / 20))}
        </View>
      </View>
      <Text style={styles.cardDescription}>{talent.genre_affinity.join(' • ')}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.tagsContainer}>
          <View style={styles.fansBadge}>
            <Text style={styles.fansText}>{talent.career_stage}</Text>
          </View>
          <View style={[styles.genreBadge, { backgroundColor: talent.availability_status === 'Available' ? '#E8F5E8' : '#FFE5D8' }]}>
            <Text
              style={[styles.genreText, { color: talent.availability_status === 'Available' ? '#4CAF50' : '#EE4C01' }]}
            >
              {talent.availability_status}
            </Text>
          </View>
          <View style={styles.reputationBadge}>
            <Text style={styles.reputationText}>{talent.reputation_level}</Text>
          </View>
        </View>
        <Text style={styles.price}>${talent.base_cost.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderNewsCard = (newsItem: EntertainmentNews) => (
    <View key={newsItem.id} style={styles.newsCard}>
      <View style={styles.newsHeader}>
        <Text style={styles.newsPublication}>{newsItem.publication_name}</Text>
        <Text style={styles.newsDate}>{new Date(newsItem.published_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.newsHeadline}>{newsItem.headline}</Text>
      <Text style={styles.newsContent}>{newsItem.content}</Text>
      <View style={styles.newsTypeContainer}>
        <View style={[styles.newsTypeBadge, { backgroundColor: getNewsTypeColor(newsItem.news_type) }]}>
          <Text style={styles.newsTypeText}>{newsItem.news_type.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );

  const getNewsTypeColor = (type: string) => {
    switch (type) {
      case 'gossip': return '#FFE5D8';
      case 'announcement': return '#E8F5E8';
      case 'scandal': return '#FFE0E0';
      case 'award': return '#FFF3CD';
      case 'death': return '#F0F0F0';
      case 'retirement': return '#E6F3FF';
      case 'comeback': return '#F0E6FF';
      default: return '#F5F5F5';
    }
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'Scripts':
        return scripts.length > 0 ? scripts.map(renderScriptCard) : (
          <Text style={styles.emptyText}>No scripts available. Generate some new ones!</Text>
        );
      case 'Actors':
        return actors.length > 0 ? actors.map(renderTalentCard) : (
          <Text style={styles.emptyText}>No actors available. Generate some new ones!</Text>
        );
      case 'Directors':
        return directors.length > 0 ? directors.map(renderTalentCard) : (
          <Text style={styles.emptyText}>No directors available. Generate some new ones!</Text>
        );
      case 'News':
        return news.length > 0 ? news.map(renderNewsCard) : (
          <Text style={styles.emptyText}>No entertainment news available.</Text>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Explore talent</Text>
            <TouchableOpacity onPress={generateNewContent} style={styles.generateButton}>
              <Add size={16} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Find scripts, actors, directors and industry news.</Text>
        </View>

        {/* Search and Filter */}
        {activeTab !== 'News' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <SearchNormal1 size={20} color="#8C8C8C" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchContent}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreFilter}>
              <TouchableOpacity
                style={[styles.genreChip, selectedGenre === '' && styles.selectedGenreChip]}
                onPress={() => filterByGenre('')}
              >
                <Text style={[styles.genreChipText, selectedGenre === '' && styles.selectedGenreChipText]}>All</Text>
              </TouchableOpacity>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[styles.genreChip, selectedGenre === genre && styles.selectedGenreChip]}
                  onPress={() => filterByGenre(genre)}
                >
                  <Text style={[styles.genreChipText, selectedGenre === genre && styles.selectedGenreChipText]}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['Scripts', 'Actors', 'Directors', 'News'] as TabType[]).map((tab) => (
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
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {renderContent()}
        </ScrollView>
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
  // New styles for enhanced functionality
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2201B2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'BuenosAires-SemiBold',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#333333',
  },
  genreFilter: {
    flexDirection: 'row',
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  selectedGenreChip: {
    backgroundColor: '#2201B2',
  },
  genreChipText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  selectedGenreChipText: {
    color: '#FFFFFF',
  },
  authorBadge: {
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authorText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#2201B2',
  },
  reputationBadge: {
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reputationText: {
    fontSize: 14,
    fontFamily: 'BuenosAires-Book',
    color: '#6B46C1',
  },
  newsCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsPublication: {
    fontSize: 14,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#EE4C01',
  },
  newsDate: {
    fontSize: 12,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  newsHeadline: {
    fontSize: 18,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#333333',
    lineHeight: 24,
  },
  newsContent: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#616060',
    lineHeight: 22,
  },
  newsTypeContainer: {
    alignItems: 'flex-start',
  },
  newsTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newsTypeText: {
    fontSize: 12,
    fontFamily: 'BuenosAires-SemiBold',
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
    textAlign: 'center',
    paddingVertical: 40,
  },
});

export default ShopScreen;
