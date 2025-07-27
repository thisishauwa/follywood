import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getMovieById, updateMovie } from '../services/movieService';

const EditMovieScreen = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'EditMovie'>>();
  const navigation = useNavigation();
  const { movieId } = route.params;

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const movieData = await getMovieById(movieId);
        if (movieData) {
          setTitle(movieData.title);
          setGenre(movieData.genre);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load movie data.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  const handleSaveChanges = async () => {
    if (!title.trim() || !genre.trim()) {
      Alert.alert('Validation Error', 'Title and Genre cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      await updateMovie(movieId, { title, genre });
      Alert.alert('Success', 'Movie details updated successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#EE4C01" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Edit Film</Text>
        
        <Text style={styles.label}>Film Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter film title"
          placeholderTextColor="#555"
        />

        <Text style={styles.label}>Genre</Text>
        <TextInput
          style={styles.input}
          value={genre}
          onChangeText={setGenre}
          placeholder="Enter genre"
          placeholderTextColor="#555"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'BuenosAires-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    color: '#8C8C8C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'BuenosAires-Book',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#EE4C01',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'BuenosAires-Medium',
  },
});

export default EditMovieScreen;
