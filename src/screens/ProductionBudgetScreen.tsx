import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ImageBackground,
  PanResponder,
  Dimensions,
} from 'react-native';
import { ArrowLeft2 } from 'iconsax-react-nativejs';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { getOrCreateUserStudio } from '../services/studioService';
import { getOrCreateDefaultScript } from '../services/scriptService';
import { Alert } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const sliderWidth = screenWidth - 80; // 40px padding on each side

interface SliderProps {
  label: string;
  value: number;
  minValue: number;
  maxValue: number;
  onValueChange: (value: number) => void;
  formatValue: (value: number) => string;
  color: string;
}

const CustomSlider: React.FC<SliderProps> = ({
  label,
  value,
  minValue,
  maxValue,
  onValueChange,
  formatValue,
  color,
}) => {
  const [sliderValue, setSliderValue] = useState(value);
  const [trackLayout, setTrackLayout] = useState({ x: 0, width: 0 });
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      // Handle initial touch
      const { locationX } = evt.nativeEvent;
      const percentage = Math.max(0, Math.min(1, locationX / trackLayout.width));
      const newValue = minValue + (maxValue - minValue) * percentage;
      setSliderValue(newValue);
      onValueChange(newValue);
    },
    onPanResponderMove: (evt) => {
      // Handle drag movement
      const { locationX } = evt.nativeEvent;
      const percentage = Math.max(0, Math.min(1, locationX / trackLayout.width));
      const newValue = minValue + (maxValue - minValue) * percentage;
      setSliderValue(newValue);
      onValueChange(newValue);
    },
  });

  const thumbPosition = ((sliderValue - minValue) / (maxValue - minValue)) * trackLayout.width;

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{formatValue(sliderValue)}</Text>
      </View>
      
      <View style={styles.sliderTrackContainer} {...panResponder.panHandlers}>
        <View 
          style={styles.sliderTrack}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            setTrackLayout({ x, width });
          }}
        >
          <View 
            style={[
              styles.sliderProgress, 
              { width: thumbPosition, backgroundColor: color }
            ]} 
          />
          <View 
            style={[
              styles.sliderThumb, 
              { left: Math.max(0, thumbPosition - 12), backgroundColor: color }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinMax}>{formatValue(minValue)}</Text>
        <Text style={styles.sliderMinMax}>{formatValue(maxValue)}</Text>
      </View>
    </View>
  );
};

const ProductionBudgetScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { filmTitle, selectedActors, selectedDirector } = route.params || {
    filmTitle: 'The Thomas Crown Affair',
    selectedActors: [],
    selectedDirector: null,
  };

  // Initial values
  const [productionBudget, setProductionBudget] = useState(10000000); // $10M
  const [marketingBudget, setMarketingBudget] = useState(5000000); // $5M
  const [productionTimeline, setProductionTimeline] = useState(12); // 12 weeks
  const [isLoading, setIsLoading] = useState(false);

  // Calculate costs from previous steps
  const scriptCost = 50000;
  const castCost = selectedActors.length * 40000;
  const directorCost = 120000; // Average director cost
  const fixedCosts = scriptCost + castCost + directorCost;
  
  const totalBudget = fixedCosts + productionBudget + marketingBudget;
  const maxBudget = 946200;

  const formatCurrency = (value: number) => `$${Math.round(value).toLocaleString()}`;
  const formatWeeks = (value: number) => `${Math.round(value)} weeks`;

  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to start production.');
      return;
    }

    // Get or create user's studio
    const studioName = user.profile?.studio_name || 'My Studio';
    const studio = await getOrCreateUserStudio(user.id, studioName);
    
    if (!studio) {
      Alert.alert('Error', 'Failed to create studio. Please try again.');
      setIsLoading(false);
      return;
    }

    // Get or create script for this film
    const script = await getOrCreateDefaultScript(filmTitle, 'Comedy');
    
    if (!script) {
      Alert.alert('Error', 'Failed to create script. Please try again.');
      setIsLoading(false);
      return;
    }
    
    const productionData = {
      studio_id: studio.id,
      script_id: script.id,
      title: filmTitle,
      genre: script.genre,
      production_stage: 'In Production',
      production_budget: Math.round(productionBudget),
      marketing_budget: Math.round(marketingBudget),
      // Additional fields for our workflow
      script_cost: scriptCost,
      cast_cost: castCost,
      director_cost: directorCost,
      production_timeline: Math.round(productionTimeline),
      total_budget: Math.round(totalBudget),
      selected_actors: selectedActors,
      selected_director: selectedDirector,
      estimated_completion: new Date(Date.now() + (Math.round(productionTimeline) * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    };
    
    try {
      const { data, error } = await supabase
        .from('movies')
        .insert([productionData])
        .select();

      if (error) {
        console.error('Error saving film:', error);
        Alert.alert('Error', 'Failed to start production. Please try again.');
        return;
      }

      console.log('Film production started:', data[0]);
      
      // Show success message and navigate to home
      Alert.alert(
        'Production Started!',
        `"${filmTitle}" is now in production. Check your films on the home screen.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const isOverBudget = totalBudget > maxBudget;

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
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
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
            style={[styles.budgetCard, isOverBudget && styles.budgetCardOverBudget]} 
            imageStyle={styles.budgetCardImage}
          >
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetLabel}>TOTAL BUDGET</Text>
              <Text style={styles.budgetText}>
                <Text style={[styles.budgetSpent, isOverBudget && styles.overBudgetText]}>
                  ${totalBudget.toLocaleString()}
                </Text>
                <Text style={styles.budgetSlash}>/</Text>
                <Text style={styles.budgetTotal}>${maxBudget.toLocaleString()}</Text>
              </Text>
              {isOverBudget && (
                <Text style={styles.overBudgetWarning}>Over budget!</Text>
              )}
            </View>
          </ImageBackground>
        </View>

        {/* Budget Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Breakdown</Text>
          
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Script & Cast & Director</Text>
              <Text style={styles.breakdownValue}>${fixedCosts.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Production Budget</Text>
              <Text style={styles.breakdownValue}>${Math.round(productionBudget).toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Marketing Budget</Text>
              <Text style={styles.breakdownValue}>${Math.round(marketingBudget).toLocaleString()}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Total</Text>
              <Text style={[styles.breakdownTotalValue, isOverBudget && styles.overBudgetText]}>
                ${totalBudget.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Sliders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Your Budgets & Timeline</Text>
          
          <CustomSlider
            label="Production Budget"
            value={productionBudget}
            minValue={100000}
            maxValue={600000}
            onValueChange={setProductionBudget}
            formatValue={formatCurrency}
            color="#EE4C01"
          />
          
          <CustomSlider
            label="Marketing Budget"
            value={marketingBudget}
            minValue={50000}
            maxValue={400000}
            onValueChange={setMarketingBudget}
            formatValue={formatCurrency}
            color="#EE4C01"
          />
          
          <CustomSlider
            label="Production Timeline"
            value={productionTimeline}
            minValue={6}
            maxValue={24}
            onValueChange={setProductionTimeline}
            formatValue={formatWeeks}
            color="#EE4C01"
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => navigation.navigate('DirectorSelection', { filmTitle, selectedActors })}
        >
          <Text style={styles.backNavText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.finishButton,
            isOverBudget && styles.finishButtonDisabled
          ]}
          onPress={handleFinish}
          disabled={isOverBudget}
        >
          <Text style={styles.finishButtonText}>
            {isOverBudget ? 'Over Budget' : 'Start Production'}
          </Text>
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
  budgetCardOverBudget: {
    backgroundColor: '#D32F2F',
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
  overBudgetText: {
    color: '#FFB3B3',
  },
  overBudgetWarning: {
    fontSize: 12,
    fontFamily: 'Buenos Aires',
    color: '#FFB3B3',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
    marginBottom: 16,
  },
  breakdownCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    color: '#616060',
  },
  breakdownValue: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 8,
  },
  breakdownTotalLabel: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
  },
  breakdownTotalValue: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
  },
  sliderContainer: {
    marginBottom: 32,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#343333',
  },
  sliderValue: {
    fontSize: 16,
    fontFamily: 'Buenos Aires',
    fontWeight: '600',
    color: '#EE4C01',
  },
  sliderTrackContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#F0EEE9',
    borderRadius: 3,
    position: 'relative',
  },
  sliderProgress: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMinMax: {
    fontSize: 12,
    fontFamily: 'Buenos Aires',
    color: '#A1AEBC',
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
  finishButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonDisabled: {
    opacity: 0.5,
  },
  finishButtonText: {
    fontSize: 18,
    fontFamily: 'Buenos Aires',
    color: '#F2F3F5',
    fontWeight: '600',
  },
});

export default ProductionBudgetScreen;
