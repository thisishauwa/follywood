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
import AboutYouScreen from './src/screens/AboutYouScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import GettingStartedScreen from './src/screens/GettingStartedScreen';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
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
import GoalsScreen from './src/screens/GoalsScreen';
import JournalEntryScreen from './src/screens/JournalEntryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import StoreScreen from './src/screens/StoreScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  GettingStarted: undefined;
  AboutYou: undefined;
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
      const onboardingScreens: (keyof RootStackParamList)[] = ['GettingStarted', 'AboutYou'];

      if (isOnboarded) {
        // If user is onboarded and on an onboarding screen, navigate to Home.
        if (onboardingScreens.includes(currentRoute as keyof RootStackParamList)) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
      } else {
        // If user is not onboarded and on a main app screen, navigate to GettingStarted.
        if (mainAppScreens.includes(currentRoute as keyof RootStackParamList)) {
          navigation.reset({ index: 0, routes: [{ name: 'GettingStarted' }] });
        }
      }
    }
  }, [user, loading, navigation]);

  return null; // This component does not render anything.
};

function AppNavigator() {
  const { user, loading } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  // Check if this is a first-time user
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const hasOpenedBefore = await AsyncStorage.getItem('hasOpenedBefore');
        if (!hasOpenedBefore) {
          // Mark as opened and set as first-time user
          await AsyncStorage.setItem('hasOpenedBefore', 'true');
          setIsFirstTime(true);
        } else {
          setIsFirstTime(false);
        }
      } catch (error) {
        console.error('Error checking first-time user:', error);
        // Default to returning user if there's an error
        setIsFirstTime(false);
      }
    };

    checkFirstTimeUser();
  }, []);

  // Show loading state while checking auth and first-time status
  if (loading || isFirstTime === null) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
      }}>
        <Text style={{
          fontSize: 16,
          color: '#64748B',
          fontFamily: 'Larsseit'
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!user) {
      if (isFirstTime) {
        console.log('First-time user, routing to Onboarding')
        return "Onboarding";
      } else {
        console.log('Returning user without session, routing to Login')
        return "Login";
      }
    }

    console.log('User found, checking onboarding status:', {
      userId: user.id,
      hasProfile: !!user.profile,
      onboardingCompleted: user.profile?.onboarding_completed,
      profileData: user.profile
    })

    if (!user.profile?.onboarding_completed) {
      console.log('User has not completed onboarding, routing to GettingStarted')
      return "GettingStarted";
    }

    console.log('User has completed onboarding, routing to MainTabs')
    return "MainTabs";
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{ headerShown: false }}
    >
      {user ? (
        // Authenticated user screens
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="GettingStarted"
            component={GettingStartedScreen}
            options={{ headerLeft: () => null, gestureEnabled: false }}
          />
          <Stack.Screen name="AboutYou" component={AboutYouScreen} />
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
        // Onboarding and auth screens for unauthenticated users
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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
    'Larsseit': require('./assets/fonts/bodyfont/Larsseit_Regular.ttf'),
    'LarsseitMedium': require('./assets/fonts/bodyfont/LarsseitMedium.otf'),
    'LarsseitBold': require('./assets/fonts/bodyfont/LarsseitBold.otf'),
    'LarsseitExtraBold': require('./assets/fonts/bodyfont/LarsseitExtraBold.otf'),
    'LarsseitBoldItalic': require('./assets/fonts/bodyfont/LarsseitBoldItalic.otf'),
    'LarsseitMediumItalic': require('./assets/fonts/bodyfont/LarsseitMediumItalic.otf'),
    'LarsseitExtraBoldItalic': require('./assets/fonts/bodyfont/LarsseitExtraBoldItalic.otf'),
    'Recoleta Regular': require('./assets/fonts/headerfont/Recoleta Regular.otf'),
    'Recoleta Medium': require('./assets/fonts/headerfont/Recoleta Medium.otf'),
    'Recoleta SemiBold': require('./assets/fonts/headerfont/Recoleta SemiBold.otf'),
    'Recoleta Bold': require('./assets/fonts/headerfont/Recoleta Bold.otf'),
    'Recoleta Light': require('./assets/fonts/headerfont/Recoleta Light.otf'),
    'Recoleta Thin': require('./assets/fonts/headerfont/Recoleta Thin.otf'),
    'Recoleta Black': require('./assets/fonts/headerfont/Recoleta Black.otf'),
    'Recoleta Alt Regular': require('./assets/fonts/headerfont/Recoleta Alt Regular.otf'),
    'Recoleta Alt Medium': require('./assets/fonts/headerfont/Recoleta Alt Medium.otf'),
    'Recoleta Alt SemiBold': require('./assets/fonts/headerfont/Recoleta Alt SemiBold.otf'),
    'Recoleta Alt Bold': require('./assets/fonts/headerfont/Recoleta Alt Bold.otf'),
    'Recoleta Alt Light': require('./assets/fonts/headerfont/Recoleta Alt Light.otf'),
    'Recoleta Alt Thin': require('./assets/fonts/headerfont/Recoleta Alt Thin.otf'),
    'Recoleta Alt Black': require('./assets/fonts/headerfont/Recoleta Alt Black.otf'),
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
