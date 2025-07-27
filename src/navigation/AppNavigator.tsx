import React from 'react';
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreenClean';
import JournalListScreen from '../screens/JournalListScreen';
import JournalEntryScreen from '../screens/JournalEntryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import AudioGuidesScreen from '../screens/AudioGuidesScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ShopScreen from '../screens/ShopScreen';
import StudiosScreen from '../screens/StudiosScreen';
import RecommendedForYouScreen from '../screens/RecommendedForYouScreen';
import StoreScreen from '../screens/StoreScreen';
import BeginProductionScreen from '../screens/BeginProductionScreen';
import CastSelectionScreen from '../screens/CastSelectionScreen';
import DirectorSelectionScreen from '../screens/DirectorSelectionScreen';
import ProductionBudgetScreen from '../screens/ProductionBudgetScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import EditMovieScreen from '../screens/EditMovieScreen';

import BottomNavBar from '../components/BottomNavBar';
import MiniPlayer from '../components/MiniPlayer';
import useAudioPlayerStore from '../stores/audioPlayerStore';

export type AppStackParamList = {
  MainTabs: undefined;
  Chat: { initialMessage?: string };
  JournalEntry: { entryId?: string; existingEntry?: any; isEditMode?: boolean };
  Goals: undefined;
  CreateGoal: undefined;
  AudioGuides: {
    guideId: string;
    title: string;
    audioUrl?: string;
    thumbnailUrl?: string;
    description?: string;
    lastPosition?: number;
  };
  Studios: undefined;
  RecommendedForYou: undefined;
  Store: undefined;
  MovieDetail: { movieId: string };
  EditMovie: { movieId: string };
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Shop: undefined;
  Studios: undefined;
  BeginProduction: undefined;
  CastSelection: { filmTitle: string };
  DirectorSelection: { filmTitle: string; selectedActors: string[] };
  ProductionBudget: { 
    filmTitle: string;
    selectedActors: string[]; 
    selectedDirector: string;
    scriptCost: number;
    castCost: number;
    directorCost: number;
  };
};

const Stack = createStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();



export const MainTabs = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNavBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Shop" component={ShopScreen} />
        <Tab.Screen name="Studios" component={StudiosScreen} />
        <Tab.Screen 
          name="BeginProduction" 
          component={BeginProductionScreen} 
          options={{ tabBarButton: () => null }} 
        />
        <Tab.Screen 
          name="CastSelection" 
          component={CastSelectionScreen} 
          options={{ tabBarButton: () => null }} 
        />
        <Tab.Screen 
          name="DirectorSelection" 
          component={DirectorSelectionScreen} 
          options={{ tabBarButton: () => null }} 
        />
        <Tab.Screen 
          name="ProductionBudget" 
          component={ProductionBudgetScreen} 
          options={{ tabBarButton: () => null }} 
        />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
      <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
      <Stack.Screen name="AudioGuides" component={AudioGuidesScreen} />
      <Stack.Screen name="Studios" component={StudiosScreen} />
      <Stack.Screen name="RecommendedForYou" component={RecommendedForYouScreen} />
      <Stack.Screen name="Store" component={StoreScreen} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <Stack.Screen name="EditMovie" component={EditMovieScreen} />
    </Stack.Navigator>
  );
};
