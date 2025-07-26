import { createStackNavigator } from "@react-navigation/stack"
import OnboardingScreen from "../screens/OnboardingScreen"
import LoginScreen from "../screens/LoginScreen"
import CreateAccountScreen from "../screens/CreateAccountScreen"
import GettingStartedScreen from "../screens/GettingStartedScreen"
import AboutYouScreen from "../screens/AboutYouScreen"

export type AuthStackParamList = {
  Onboarding: undefined
  Login: undefined
  CreateAccount: undefined
  GettingStarted: undefined
  AboutYou: undefined
}

const Stack = createStackNavigator<AuthStackParamList>()

export const AuthNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="GettingStarted" component={GettingStartedScreen} />
      <Stack.Screen name="AboutYou" component={AboutYouScreen} />
    </Stack.Navigator>
  )
}
