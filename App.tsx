import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { AppRegistry, Linking, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Auth
import { AuthProvider, useAuth, navigationRef } from './src/contexts/AuthContext';

// Screens
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import StudioCreationScreen from './src/screens/StudioCreationScreen';
// import HomeScreen from './src/screens/HomeScreen';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-gesture-handler';
import { PaystackProvider } from 'react-native-paystack-webview';
import { MainTabs } from './src/navigation/AppNavigator';
import AudioGuidesScreen from './src/screens/AudioGuidesScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreateGoalScreen from './src/screens/CreateGoalScreen';
import EditPasswordScreen from './src/screens/EditPasswordScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import FullNameScreen from './src/screens/FullNameScreen';
import GenreSelectionScreen from './src/screens/GenreSelectionScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import JournalEntryScreen from './src/screens/JournalEntryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import StoreScreen from './src/screens/StoreScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  FullName: undefined;
  StudioCreation: undefined;
  GenreSelection: undefined;
  CreateAccount: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { 
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    type?: string;
  };
  MainTabs: undefined;
  Chat: undefined;
  Journal: undefined;
  JournalEntry: undefined;
  Goals: undefined;
  CreateGoal: undefined;
  AudioGuides: undefined;
  Profile: undefined;
  EditProfile: undefined;
  EditPassword: undefined;
  Subscription: undefined;
  Store: undefined;
  Rewards: undefined;
};

// Deep linking configuration
const linking = {
  prefixes: [
    'talktoaugust://', 
    'com.mycompany.talktoaugust://',
    // For production builds
    'https://talktoaugust.app',
  ],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      // Audio guide deep linking
      AudioGuides: {
        path: 'audio/:guideId',
        parse: {
          guideId: (guideId: string) => guideId,
        },
        stringify: {
          guideId: (id: string) => id,
        },
      },
    },
  },
};

const Stack = createStackNavigator<RootStackParamList>();

type AppNavigationProp = StackNavigationProp<RootStackParamList>;

// Auth-aware navigation component
const AppRouter = () => {
  const { user, loading } = useAuth();
  console.log('user:', user);
  const navigation = useNavigation<AppNavigationProp>();

  useEffect(() => {
    if (loading) return;

    const state = navigation.getState();
    if (!state) return;

    const currentRoute = state.routes[state.index].name;

    if (user) {
      const isOnboarded = user.profile?.onboarding_completed;
      const mainAppScreens: (keyof RootStackParamList)[] = ['MainTabs', 'Chat', 'JournalEntry', 'Goals', 'CreateGoal', 'AudioGuides', 'Profile'];
      const onboardingScreens: (keyof RootStackParamList)[] = ['StudioCreation'];

      if (isOnboarded) {
        // If user is onboarded and on an onboarding screen, navigate to Home.
        if (onboardingScreens.includes(currentRoute as keyof RootStackParamList)) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
      } else {
        // If user is not onboarded and on a main app screen, navigate to GettingStarted.
        if (mainAppScreens.includes(currentRoute as keyof RootStackParamList)) {
          navigation.reset({ index: 0, routes: [{ name: 'StudioCreation' }] });
        }
      }
    }
  }, [user, loading, navigation]);

  return null; // This component does not render anything.
};

function AppNavigator() {
  const { user, loading } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const hasOpenedBefore = await AsyncStorage.getItem('hasOpenedBefore');
        if (hasOpenedBefore === null) {
          await AsyncStorage.setItem('hasOpenedBefore', 'true');
          setIsFirstTime(true);
        } else {
          setIsFirstTime(false);
        }
      } catch (error) {
        console.error('Error checking first-time user status:', error);
        setIsFirstTime(false); // Default to not first time on error
      }
    };
    checkFirstTimeUser();
  }, []);

  if (loading || isFirstTime === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 16, color: '#64748B', fontFamily: 'BuenosAires-Book' }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Debug navigation state
  console.log('App navigation - user exists:', !!user);
  console.log('App navigation - user profile:', user?.profile);
  console.log('App navigation - onboarding_completed:', user?.profile?.onboarding_completed);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        user.profile?.onboarding_completed ? (
          // Fully onboarded user screens
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
            <Stack.Screen name="Goals" component={GoalsScreen} />
            <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
            <Stack.Screen name="AudioGuides" component={AudioGuidesScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="EditPassword" component={EditPasswordScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="Store" component={StoreScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
          </>
        ) : (
          // Authenticated but not onboarded user screens
          <>
            <Stack.Screen name="FullName" component={FullNameScreen} />
            <Stack.Screen name="StudioCreation" component={StudioCreationScreen} />
            <Stack.Screen name="GenreSelection" component={GenreSelectionScreen} />
          </>
        )
      ) : (
        // Unauthenticated user screens
        <>
          {isFirstTime ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : null}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const key = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const navigationRef = React.useRef<any>(null);

  const [fontsLoaded, fontsError] = useFonts({
    'BuenosAires-Black': require('./assets/fonts/body/BuenosAires-Black.ttf'),
    'BuenosAires-BlackItalic': require('./assets/fonts/body/BuenosAires-BlackItalic.ttf'),
    'BuenosAires-Bold': require('./assets/fonts/body/BuenosAires-Bold.ttf'),
    'BuenosAires-BoldItalic': require('./assets/fonts/body/BuenosAires-BoldItalic.ttf'),
    'BuenosAires-Book': require('./assets/fonts/body/BuenosAires-Book.ttf'),
    'BuenosAires-BookItalic': require('./assets/fonts/body/BuenosAires-BookItalic.ttf'),
    'BuenosAires-Light': require('./assets/fonts/body/BuenosAires-Light.ttf'),
    'BuenosAires-RegularItalic': require('./assets/fonts/body/BuenosAires-RegularItalic.ttf'),
    'BuenosAires-SemiBold': require('./assets/fonts/body/BuenosAires-SemiBold.ttf'),
    'BuenosAires-SemiBoldItalic': require('./assets/fonts/body/BuenosAires-SemiBoldItalic.ttf'),
    'BuenosAires-Thin': require('./assets/fonts/body/BuenosAires-Thin.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <PaystackProvider
          publicKey={key || 'pk_test_placeholder'}
          currency="NGN"
        >
          <NavigationContainer ref={navigationRef} linking={linking}>
            <AppNavigator />
            <AppRouter />
          </NavigationContainer>
        </PaystackProvider>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}

// Register the main component
AppRegistry.registerComponent('main', () => App);
