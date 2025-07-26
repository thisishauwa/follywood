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
import ProfileScreen from '../screens/ProfileScreen';
import RecommendedForYouScreen from '../screens/RecommendedForYouScreen';
import StoreScreen from '../screens/StoreScreen'; 

import BottomNavBar from '../components/BottomNavBar';
import FloatingAugustButton from '../components/FloatingAugustButton';
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
  Profile: undefined;
  RecommendedForYou: undefined;
  Store: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Journal: undefined;
  Goals: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Wrapper component to add FloatingAugustButton to any screen
const withFloatingButton = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    const { currentTrack } = useAudioPlayerStore();
    return (
      <View style={{ flex: 1 }}>
        <Component {...props} />
        <View style={{ bottom: currentTrack ? 60 : 0 }}>
          <FloatingAugustButton />
        </View>
      </View>
    );
  };
};

// Wrap all tab screens with the floating button
const HomeScreenWithFAB = withFloatingButton(HomeScreen);
const ExploreScreenWithFAB = withFloatingButton(ExploreScreen);
const JournalScreenWithFAB = withFloatingButton(JournalListScreen);
const GoalsScreenWithFAB = withFloatingButton(GoalsScreen);

export const MainTabs = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNavBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Explore" component={ExploreScreenWithFAB} />
        <Tab.Screen name="Journal" component={JournalScreenWithFAB} />
        <Tab.Screen name="Goals" component={GoalsScreenWithFAB} />
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
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="RecommendedForYou" component={RecommendedForYouScreen} />
      <Stack.Screen name="Store" component={StoreScreen} />
    </Stack.Navigator>
  );
};
