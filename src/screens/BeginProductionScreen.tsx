import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
} from "react-native";
import { ArrowLeft2, People, Star1 } from "iconsax-react-nativejs";
import { useAuth } from "../contexts/AuthContext";

interface Script {
  id: string;
  title: string;
  description: string;
  genre: string;
  rating: number;
  fans: number;
  price: number;
  selected?: boolean;
}

const BeginProductionScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [filmTitle, setFilmTitle] = useState("");
  const [selectedScript, setSelectedScript] = useState<string | null>(null);


  
  // Sample scripts based on PRD
  const scripts: Script[] = [
    {
      id: "1",
      title: "Midnight Terror",
      description: "A psychological thriller about a haunted house that eats people.",
      genre: "horror",
      rating: 3,
      fans: 12,
      price: 50000,
    },
    {
      id: "2", 
      title: "Laugh with Your Family",
      description: "A meta-comedy about TV show makers in the heart of Follywood.",
      genre: "comedy",
      rating: 2,
      fans: 8,
      price: 30000,
    },
  ];

  const totalBudget = user?.profile?.studio_name ? 946200 : 1000000; // Sample budget
  const totalSpent = selectedScript ? scripts.find(s => s.id === selectedScript)?.price || 0 : 0;

  const handleScriptSelect = (scriptId: string) => {
    setSelectedScript(scriptId);
  };

  const handleNext = () => {
    if (!filmTitle.trim() || !selectedScript) {
      return; // Add validation feedback later
    }
    // Navigate to cast selection step
    navigation.navigate('CastSelection', { filmTitle: filmTitle.trim() });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <View key={index} style={styles.starContainer}>
        <Star1
          size={14}
          color={index < rating ? "#EE4C01" : "#FFE5D8"}
          variant={index < rating ? "Bold" : "Linear"}
        />
      </View>
    ));
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
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Film Title Section */}
        <View style={styles.section}>
          <TextInput
            style={styles.titleInput}
            value={filmTitle}
            onChangeText={setFilmTitle}
            placeholder="Enter film title"
            placeholderTextColor="#B4B4B4"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <ImageBackground source={require('../../assets/images/cardbg.png')} style={styles.budgetCard} imageStyle={styles.budgetCardImage}>
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

        {/* Choose Script Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose script</Text>
          
          <View style={styles.scriptsContainer}>
            {scripts.map((script) => (
              <TouchableOpacity
                key={script.id}
                style={[
                  styles.scriptCard,
                  selectedScript === script.id && styles.selectedScriptCard
                ]}
                onPress={() => handleScriptSelect(script.id)}
              >
                <View style={styles.scriptHeader}>
                  <Text style={styles.scriptTitle}>{script.title}</Text>
                  <View style={styles.starsContainer}>
                    {renderStars(script.rating)}
                  </View>
                </View>
                
                <Text style={styles.scriptDescription}>{script.description}</Text>
                
                <View style={styles.scriptFooter}>
                  <View style={styles.scriptTags}>
                    <View style={styles.fansTag}>
                      <People size={20} color="#EE4C01" />
                      <Text style={styles.tagText}>{script.fans} fans</Text>
                    </View>
                    <View style={styles.genreTag}>
                      <Text style={styles.tagText}>{script.genre}</Text>
                    </View>
                  </View>
                  <Text style={styles.scriptPrice}>${script.price.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, (!filmTitle.trim() || !selectedScript) && styles.continueButtonDisabled]}
          onPress={handleNext}
          disabled={!filmTitle.trim() || !selectedScript}
        >
          <Text style={styles.continueButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Buenos Aires",
    color: "#343333",
    textAlign: "center",
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F0EEE9",
  },
  activeDot: {
    backgroundColor: "#EE4C01",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140, // Space for bottom button
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 24,
    fontFamily: "Buenos Aires",
    color: "#B4B4B4",
    marginBottom: 16,
  },
  titleInput: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: "Buenos Aires",
    color: "#343333",
    marginBottom: 16,
  },
  budgetCard: {
    height: 96,
    backgroundColor: "#2201B2", // Purple background like in design
    borderRadius: 12,
    padding: 21,
    justifyContent: "center",
  },
  budgetCardImage: {
    borderRadius: 12,
  },
  budgetInfo: {
    gap: 4,
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: "Buenos Aires",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  budgetText: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  budgetSpent: {
    fontSize: 20,
    fontFamily: "Buenos Aires",
    fontWeight: "600",
    color: "#FFFFFF",
  },
  budgetSlash: {
    fontSize: 20,
    fontFamily: "Buenos Aires",
    fontWeight: "300",
    color: "#FFFFFF",
  },
  budgetTotal: {
    fontSize: 16,
    fontFamily: "Buenos Aires",
    fontWeight: "300",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Buenos Aires",
    fontWeight: "600",
    color: "#343333",
    marginBottom: 16,
  },
  scriptsContainer: {
    gap: 16,
  },
  scriptCard: {
    padding: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedScriptCard: {
    borderColor: "#2201B2",
  },
  scriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  scriptTitle: {
    fontSize: 16,
    fontFamily: "Buenos Aires",
    fontWeight: "600",
    color: "#343333",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  starContainer: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scriptDescription: {
    fontSize: 16,
    fontFamily: "Buenos Aires",
    color: "#616060",
    marginBottom: 20,
    lineHeight: 22,
  },
  scriptFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scriptTags: {
    flexDirection: "row",
    gap: 8,
  },
  fansTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFE5D8",
    borderRadius: 20,
    gap: 4,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFE5D8",
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontFamily: "Buenos Aires",
    color: "#EE4C01",
  },
  scriptPrice: {
    fontSize: 18,
    fontFamily: "Buenos Aires",
    fontWeight: "600",
    color: "#000000",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2201B2",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    height: 112,
    justifyContent: "flex-start",
  },
  continueButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#F5F5F5",
    fontSize: 18,
    fontFamily: "Buenos Aires",
  },
});

export default BeginProductionScreen;
