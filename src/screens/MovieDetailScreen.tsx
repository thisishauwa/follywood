import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { deleteMovie, getMovieById } from '../services/movieService';

// Ideally, this would be in a shared types file
interface Movie {
  id: string;
  title: string;
  genre: string;
  production_stage: string;
  total_budget?: number;
  selected_actors: string[];
  selected_director: string;
  box_office_earnings: number;
}

const MovieDetailScreen = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'MovieDetail'>>();
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { movieId } = route.params;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const movieData = await getMovieById(movieId);
        setMovie(movieData);
      } catch (err) {
        setError('Failed to fetch movie details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Film',
      'Are you sure you want to delete this film? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMovie(movieId);
              Alert.alert('Success', 'Film deleted successfully.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete the film.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#EE4C01" />
      </SafeAreaView>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error || 'Movie not found.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{movie.title}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Genre</Text>
          <Text style={styles.value}>{movie.genre}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{movie.production_stage}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Budget</Text>
          <Text style={styles.value}>${(movie.total_budget || 0).toLocaleString()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Director</Text>
          <Text style={styles.value}>{movie.selected_director}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Cast</Text>
          <Text style={styles.value} numberOfLines={2}>{movie.selected_actors?.join(', ')}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Box Office</Text>
          <Text style={styles.value}>${movie.box_office_earnings.toLocaleString()}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditMovie', { movieId: movie.id })}>
            <Text style={styles.editButtonText}>Edit Film</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Film</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'BuenosAires-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
  },
  value: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Medium',
    color: '#FFFFFF',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'BuenosAires-Book',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 16,
  },
  editButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'BuenosAires-Medium',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'rgba(238, 76, 1, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#EE4C01',
    fontSize: 16,
    fontFamily: 'BuenosAires-Medium',
  }
});

export default MovieDetailScreen;
