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

interface Actor {
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

const CastSelectionScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { filmTitle } = route.params || { filmTitle: 'The Thomas Crown Affair' };
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  
  // Sample actors data
  const actors: Actor[] = [
    {
      id: '1',
      name: 'Ryan Gooseman',
      age: 52,
      description: 'The 52 year old actor is a powerhouse when it comes to dancing and breeding.',
      price: 30000,
      fans: 12,
      genres: ['horror', 'art house'],
      traits: ['diva', 'method actor'],
      rating: 3,
    },
    {
      id: '2',
      name: 'Sarah Mitchell',
      age: 34,
      description: 'A versatile actress known for her dramatic range and comedic timing.',
      price: 45000,
      fans: 28,
      genres: ['drama', 'comedy'],
      traits: ['professional', 'charismatic'],
      rating: 4,
    },
    {
      id: '3',
      name: 'Marcus Chen',
      age: 41,
      description: 'Action star with extensive martial arts background and stunt experience.',
      price: 55000,
      fans: 35,
      genres: ['action', 'thriller'],
      traits: ['athletic', 'dedicated'],
      rating: 4,
    },
  ];

  const totalSpent = 50000; // Script cost from previous step
  const totalBudget = 946200;

  const handleActorSelect = (actorId: string) => {
    if (selectedActors.includes(actorId)) {
      setSelectedActors(selectedActors.filter(id => id !== actorId));
    } else if (selectedActors.length < 3) {
      setSelectedActors([...selectedActors, actorId]);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 3 }, (_, index) => (
      <Star1
        key={index}
        size={16}
        color={index < rating ? '#EE4C01' : '#E5E5EA'}
        variant={index < rating ? 'Bold' : 'Linear'}
      />
    ));
  };

  const renderActorCard = (actor: Actor) => {
    const isSelected = selectedActors.includes(actor.id);
    
    return (
      <TouchableOpacity
        key={actor.id}
        style={[
          styles.actorCard,
          isSelected && styles.selectedActorCard
        ]}
        onPress={() => handleActorSelect(actor.id)}
      >
        <View style={styles.actorHeader}>
          <Text style={styles.actorName}>{actor.name}</Text>
          <Text style={styles.actorPrice}>${actor.price.toLocaleString()}</Text>
        </View>
        
        <Text style={styles.actorDescription}>{actor.description}</Text>
        
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <People size={20} color="#EE4C01" />
            <Text style={styles.tagText}>{actor.fans} fans</Text>
          </View>
          
          <View style={styles.tag}>
            <Text style={styles.tagText}>{actor.genres.join(', ')}</Text>
          </View>
          
          <View style={styles.tag}>
            <Text style={styles.tagText}>{actor.traits.join(', ')}</Text>
          </View>
          
          <View style={styles.tag}>
            <View style={styles.starsContainer}>
              {renderStars(actor.rating)}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleNext = () => {
    if (selectedActors.length === 0) return;
    
    // Navigate to director selection step
    navigation.navigate('DirectorSelection', { 
      filmTitle, 
      selectedActors 
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
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
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

        {/* Cast Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select main cast ({selectedActors.length}/3)</Text>
          
          <View style={styles.actorsContainer}>
            {actors.map(renderActorCard)}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => navigation.navigate('BeginProduction')}
        >
          <Text style={styles.backNavText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            selectedActors.length === 0 && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={selectedActors.length === 0}
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
  actorsContainer: {
    gap: 16,
  },
  actorCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  selectedActorCard: {
    backgroundColor: '#FFE5D8',
    borderWidth: 2,
    borderColor: '#EE4C01',
  },
  actorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actorName: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
  },
  actorPrice: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#000000',
  },
  actorDescription: {
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

export default CastSelectionScreen;
