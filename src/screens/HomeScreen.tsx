"use client";
"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from "react-native";
import { Setting2, People, VideoPlay } from "iconsax-react-nativejs";
import { useAuth } from "../contexts/AuthContext";

const HomeScreen = () => {
  const { user } = useAuth();
  const [accountBalance] = useState(945200);
  const [dailyChange] = useState(2000);
  const [fanCount] = useState(12);
  const [filmCount] = useState(0);

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
          <TouchableOpacity style={styles.settingsButton}>
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
            <Text style={styles.statText}>{filmCount} films</Text>
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

        {/* Get Started Section */}
        <View style={styles.getStartedSection}>
          <Text style={styles.sectionTitle}>Get started</Text>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Begin a production</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Browse scripts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Scout talent</Text>
          </TouchableOpacity>
        </View>
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
    gap: 8,
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
    borderRadius: 50, // Fully rounded
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 18,
    fontFamily: "BuenosAires-Book",
    color: "#DA4500",
    textAlign: "center",
  },
});

export default HomeScreen;
