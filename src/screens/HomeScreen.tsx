"use client";
"use client";

import React, { useState, useEffect } from "react";
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { TabParamList, AppStackParamList } from "../navigation/AppNavigator";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  StatusBar,
} from "react-native";
import { People, VideoPlay, Star1, Setting2 } from "iconsax-react-nativejs";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { getUserStudio } from "../services/studioService";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  StackNavigationProp<AppStackParamList>
>;

interface Movie {
  id: string;
  title: string;
  genre: string;
  production_stage: string;
  production_budget: number;
  marketing_budget: number;
  total_budget?: number;
  created_at: string;
  estimated_completion?: string;
  production_timeline?: number;
  box_office_earnings: number;
}

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const [accountBalance] = useState(945200);
  const [dailyChange] = useState(2000);
  const [fanCount] = useState(12);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [movieCount, setMovieCount] = useState(0);

  // Fetch user's movies from Supabase
  const fetchMovies = async () => {
    if (!user) return;

    try {
      // First get the user's studio
      const studio = await getUserStudio(user.id);

      if (!studio) {
        // No studio yet, no movies to show
        setMovies([]);
        setMovieCount(0);
        return;
      }

      // Fetch movies for this studio
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("studio_id", studio.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching movies:", error);
        return;
      }

      setMovies(data || []);
      setMovieCount(data?.length || 0);
    } catch (error) {
      console.error("Unexpected error fetching movies:", error);
    }
  };

  // Fetch movies when component mounts and when screen is focused
  useEffect(() => {
    fetchMovies();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMovies();
    }, [user])
  );

  // Get user's studio name and genres for display
  const studioName = user?.profile?.studio_name || "Your Studio";
  const userGenres = user?.profile?.genre
    ? [user.profile.genre]
    : ["Action", "Comedy", "Thriller"];
  const genreText = userGenres.join(", ") + " Studio";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.studioInfo}>
            <Text style={styles.studioName}>{studioName}</Text>
            <Text style={styles.studioGenres}>{genreText}</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Setting2 size={24} color="#8C8C8C" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <People size={24} color="#8C8C8C" />
            <Text style={styles.statText}>{fanCount} fans</Text>
          </View>
          <View style={styles.statItem}>
            <VideoPlay size={24} color="#8C8C8C" />
            <Text style={styles.statText}>{movieCount} films</Text>
          </View>
        </View>

        {/* Account Balance Card */}
        <View style={styles.balanceCard}>
          <ImageBackground
            source={require("../../assets/images/cardbg.png")}
            style={styles.balanceBackground}
            imageStyle={styles.balanceBackgroundImage}
          >
            <View style={styles.balanceContent}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>YOUR ACCOUNT</Text>
                <Text style={styles.balanceAmount}>
                  ${accountBalance.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.balanceChange}>
                +${dailyChange.toLocaleString()}.00
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Conditional Section - Get Started for new users, Your Films for existing users */}
        {movies.length === 0 ? (
          <View style={styles.getStartedSection}>
            <Text style={styles.sectionTitle}>Get started</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("BeginProduction")}
            >
              <Text style={styles.actionButtonText}>Begin a production</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Browse scripts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Scout talent</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.filmsSection}>
            <View style={styles.filmsSectionHeader}>
              <Text style={styles.sectionTitle}>Your films</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            {movies.slice(0, 2).map((movie) => (
              <TouchableOpacity
                key={movie.id}
                style={styles.filmCard}
                onPress={() =>
                  navigation.navigate("MovieDetail", { movieId: movie.id })
                }
              >
                <View style={styles.filmHeader}>
                  <Text style={styles.filmTitle}>{movie.title}</Text>
                  <View style={styles.filmRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star1
                        key={star}
                        size={16}
                        color={star <= 2 ? "#EE4C01" : "#FFE5D8"}
                        variant={star <= 2 ? "Bold" : "Linear"}
                      />
                    ))}
                  </View>
                </View>

                <Text style={styles.filmDescription}>
                  {movie.production_stage === "In Production"
                    ? `Currently in production. ${
                        movie.genre
                      } film with $${movie.production_budget?.toLocaleString()} budget.`
                    : `A ${movie.genre.toLowerCase()} film that earned $${movie.box_office_earnings?.toLocaleString()} at the box office.`}
                </Text>

                <View style={styles.filmFooter}>
                  <View style={styles.filmTags}>
                    <View style={styles.filmTag}>
                      <People size={20} color="#EE4C01" />
                      <Text style={styles.filmTagText}>12 fans</Text>
                    </View>
                    <View style={styles.filmTag}>
                      <Text style={styles.filmTagText}>
                        {movie.production_stage === "In Production"
                          ? "in production"
                          : movie.genre.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.filmEarnings}>
                    {movie.production_stage === "In Production"
                      ? `-$${(
                          movie.total_budget ||
                          movie.production_budget + movie.marketing_budget
                        ).toLocaleString()}`
                      : `+$${
                          movie.box_office_earnings?.toLocaleString() ||
                          "30,000"
                        }`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 79,
    paddingBottom: 100, // Space for bottom nav
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  studioInfo: {
    flex: 1,
  },
  studioName: {
    fontSize: 20,
    fontFamily: "BuenosAires-SemiBold",
    color: "#333333",
    marginBottom: 2,
  },
  studioGenres: {
    fontSize: 14,
    fontFamily: "BuenosAires-Book",
    color: "#8C8C8C",
  },
  settingsButton: {
    width: 48,
    height: 48,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  statText: {
    fontSize: 16,
    fontFamily: "BuenosAires-Book",
    color: "#8C8C8C",
  },
  balanceCard: {
    height: 128,
    marginBottom: 32,
  },
  balanceBackground: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  balanceBackgroundImage: {
    borderRadius: 20,
  },
  balanceContent: {
    flex: 1,
    backgroundColor: "rgba(3, 8, 112, 0.4)", // Overlay - reduced opacity by half
    padding: 24,
    justifyContent: "space-between",
  },
  balanceInfo: {
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: "BuenosAires-Book",
    color: "#EBEBED",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 30,
    fontFamily: "BuenosAires-SemiBold",
    color: "#F5F5F5",
  },
  balanceChange: {
    fontSize: 16,
    fontFamily: "BuenosAires-Book",
    color: "#71CC40",
  },
  getStartedSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "BuenosAires-SemiBold",
    color: "#343333",
  },
  actionButton: {
    backgroundColor: "#FFEEE7",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 18,
    fontFamily: "BuenosAires-Book",
    color: "#DA4500",
    textAlign: "center",
  },
  filmsSection: {
    gap: 16,
  },
  filmsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "BuenosAires-Book",
    color: "#EE4C01",
  },
  filmCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  filmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filmTitle: {
    fontSize: 16,
    fontFamily: "BuenosAires-SemiBold",
    color: "#343333",
  },
  filmRating: {
    flexDirection: "row",
    gap: 2,
  },
  filmDescription: {
    fontSize: 16,
    fontFamily: "BuenosAires-Book",
    color: "#616060",
    lineHeight: 22,
  },
  filmFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filmTags: {
    flexDirection: "row",
    gap: 8,
  },
  filmTag: {
    backgroundColor: "#FFE5D8",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filmTagText: {
    fontSize: 14,
    fontFamily: "BuenosAires-Book",
    color: "#EE4C01",
  },
  filmEarnings: {
    fontSize: 18,
    fontFamily: "BuenosAires-SemiBold",
    color: "#000000",
  },
});

export default HomeScreen;
