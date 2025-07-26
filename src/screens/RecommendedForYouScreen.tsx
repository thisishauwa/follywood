import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'iconsax-react-nativejs';

// Dummy data for the recommendations
const recommendations = [
  {
    id: '1',
    title: 'Understanding Your Attachment Style',
    description: 'Learn how your attachment style impacts your relationships and discover ways to build more secure connections.',
  },
  {
    id: '2',
    title: 'Mindful Dating',
    description: 'Practice mindfulness to stay present and make conscious choices in your dating life. Reduce anxiety and find more joy.',
  },
  {
    id: '3',
    title: 'Communicating Your Needs',
    description: 'Effective communication is key to any successful relationship. Learn how to express your needs clearly and respectfully.',
  },
  {
    id: '4',
    title: 'Building Self-Confidence',
    description: 'Boost your self-esteem and approach dating with more confidence. Discover your strengths and what makes you a great partner.',
  },
  {
    id: '5',
    title: 'Navigating Conflict',
    description: 'Learn healthy strategies for navigating disagreements and resolving conflicts in a constructive way.',
  },
];

const RecommendedForYouScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommended For You</Text>
      </View>
      <ScrollView style={styles.container}>
        {
          recommendations.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <TouchableOpacity style={styles.learnMoreButton}>
                <Text style={styles.learnMoreButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          ))
        }
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  learnMoreButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  learnMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RecommendedForYouScreen;
