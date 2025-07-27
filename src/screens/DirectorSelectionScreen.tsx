import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { ArrowLeft2, People, Star1 } from 'iconsax-react-nativejs';
import { useAuth } from '../contexts/AuthContext';

interface Director {
  id: string;
  name: string;
  age: number;
  description: string;
  price: number;
  fans: number;
  genres: string[];
  traits: string[];
  rating: number;
}

const DirectorSelectionScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { filmTitle, selectedActors } = route.params || { 
    filmTitle: 'The Thomas Crown Affair', 
    selectedActors: [] 
  };
  const [selectedDirector, setSelectedDirector] = useState<string | null>(null);
  
  // Sample directors data
  const directors: Director[] = [
    {
      id: '1',
      name: 'Christopher Nolan',
      age: 54,
      description: 'Master of complex narratives and practical effects, known for mind-bending thrillers.',
      price: 150000,
      fans: 89,
      genres: ['thriller', 'sci-fi', 'drama'],
      traits: ['visionary', 'perfectionist'],
      rating: 5,
    },
    {
      id: '2',
      name: 'Greta Gerwig',
      age: 40,
      description: 'Acclaimed indie director with a talent for character-driven stories and authentic dialogue.',
      price: 85000,
      fans: 45,
      genres: ['drama', 'comedy', 'coming-of-age'],
      traits: ['authentic', 'collaborative'],
      rating: 4,
    },
    {
      id: '3',
      name: 'Jordan Peele',
      age: 44,
      description: 'Horror innovator who blends social commentary with psychological thrills.',
      price: 120000,
      fans: 67,
      genres: ['horror', 'thriller', 'social commentary'],
      traits: ['innovative', 'thought-provoking'],
      rating: 5,
    },
    {
      id: '4',
      name: 'Denis Villeneuve',
      age: 56,
      description: 'Visually stunning storyteller specializing in epic science fiction and drama.',
      price: 140000,
      fans: 72,
      genres: ['sci-fi', 'drama', 'thriller'],
      traits: ['cinematic', 'atmospheric'],
      rating: 5,
    },
  ];

  // Calculate total spent (script + cast + director)
  const scriptCost = 50000;
  const castCost = selectedActors.length * 40000; // Assuming average actor cost
  const directorCost = selectedDirector ? directors.find(d => d.id === selectedDirector)?.price || 0 : 0;
  const totalSpent = scriptCost + castCost + directorCost;
  const totalBudget = 946200;

  const handleDirectorSelect = (directorId: string) => {
    setSelectedDirector(directorId === selectedDirector ? null : directorId);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star1
        key={index}
        size={16}
        color={index < rating ? '#EE4C01' : '#E5E5EA'}
        variant={index < rating ? 'Bold' : 'Linear'}
      />
    ));
  };

  const renderDirectorCard = (director: Director) => {
    const isSelected = selectedDirector === director.id;
    
    return (
      <TouchableOpacity
        key={director.id}
        style={[
          styles.directorCard,
          isSelected && styles.selectedDirectorCard
        ]}
        onPress={() => handleDirectorSelect(director.id)}
      >
        <View style={styles.directorHeader}>
          <Text style={styles.directorName}>{director.name}</Text>
          <Text style={styles.directorPrice}>${director.price.toLocaleString()}</Text>
        </View>
        
        <Text style={styles.directorDescription}>{director.description}</Text>
        
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <People size={20} color="#EE4C01" />
            <Text style={styles.tagText}>{director.fans} fans</Text>
          </View>
          
          <View style={styles.tag}>
            <Text style={styles.tagText}>{director.genres.join(', ')}</Text>
          </View>
          
          <View style={styles.tag}>
            <Text style={styles.tagText}>{director.traits.join(', ')}</Text>
          </View>
          
          <View style={styles.tag}>
            <View style={styles.starsContainer}>
              {renderStars(director.rating)}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleNext = () => {
    if (!selectedDirector) return;
    
    // Navigate to production budget step
    navigation.navigate('ProductionBudget', { 
      filmTitle, 
      selectedActors, 
      selectedDirector 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft2 size={24} color="#2E2E2E" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create new film</Text>
        
        {/* Progress dots */}
        <View style={styles.progressDots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Film Title Display */}
        <View style={styles.section}>
          <Text style={styles.filmTitle}>{filmTitle}</Text>
          
          <ImageBackground 
            source={require('../../assets/images/cardbg.png')} 
            style={styles.budgetCard} 
            imageStyle={styles.budgetCardImage}
          >
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetLabel}>TOTAL SPENT</Text>
              <Text style={styles.budgetText}>
                <Text style={styles.budgetSpent}>${totalSpent.toLocaleString()}</Text>
                <Text style={styles.budgetSlash}>/</Text>
                <Text style={styles.budgetTotal}>${totalBudget.toLocaleString()}</Text>
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Director Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select director {selectedDirector ? '(1/1)' : '(0/1)'}</Text>
          
          <View style={styles.directorsContainer}>
            {directors.map(renderDirectorCard)}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => navigation.navigate('CastSelection', { filmTitle })}
        >
          <Text style={styles.backNavText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !selectedDirector && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!selectedDirector}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    color: '#343333',
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0EEE9',
  },
  activeDot: {
    backgroundColor: '#EE4C01',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  section: {
    marginBottom: 32,
  },
  filmTitle: {
    fontSize: 24,
    fontFamily: 'Buenos Aires',
    color: '#343333',
    marginBottom: 16,
  },
  budgetCard: {
    height: 96,
    backgroundColor: '#2201B2',
    borderRadius: 12,
    padding: 21,
    justifyContent: 'center',
  },
  budgetCardImage: {
    borderRadius: 12,
  },
  budgetInfo: {
    gap: 4,
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: 'Buenos Aires',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  budgetSpent: {
    fontSize: 20,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  budgetSlash: {
    fontSize: 20,
    fontFamily: 'Buenos Aires',
    fontWeight: '300',
    color: '#FFFFFF',
  },
  budgetTotal: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    fontWeight: '300',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
    marginBottom: 16,
  },
  directorsContainer: {
    gap: 16,
  },
  directorCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  selectedDirectorCard: {
    backgroundColor: '#FFE5D8',
    borderWidth: 2,
    borderColor: '#EE4C01',
  },
  directorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  directorName: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
  },
  directorPrice: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#000000',
  },
  directorDescription: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    color: '#616060',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFE5D8',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Buenos Aires',
    color: '#EE4C01',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 112,
    backgroundColor: '#2201B2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backNavButton: {
    width: 80,
    height: 112,
    backgroundColor: '#17017A',
    borderTopLeftRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -20,
  },
  backNavText: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    color: '#9598E2',
  },
  nextButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    color: '#F2F3F5',
  },
});

export default DirectorSelectionScreen;
