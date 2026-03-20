import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Button } from '@react-navigation/elements';
import { useState } from 'react';
import { CreateAccountScreen, LoginScreen, ResetPasswordScreen } from "./Authentication";
import { RecommendationScreen } from "./Recommendations"
import { HistoryScreen } from './History';
import { ClosetScreen } from './Closet';
import { SettingsScreen } from './Settings';

type RootStackParamList = {  
  'Create Account': undefined;  
  'Login': undefined;  
  'Reset Password': undefined;  
};  

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack({ onSignIn }: { onSignIn: () => void }) {
  return (
    //TODO: Change initial route name to home screen if already logged in
    <Stack.Navigator initialRouteName='Create Account'>
      <Stack.Screen name="Create Account">
        {() => <CreateAccountScreen onSignIn={onSignIn} />}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {() => <LoginScreen onSignIn={onSignIn} />}
      </Stack.Screen>
      <Stack.Screen name="Reset Password" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

function NavigationTab({ onSignOut }: { onSignOut: () => void }) {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Recommendations"
        component={RecommendationScreen}
      />
      <Tab.Screen
        name="Closet"
        component={ClosetScreen}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );

}

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  //TODO: Replace with real auth/token validation when backend auth is connected.
  return isSignedIn
    ? <NavigationTab onSignOut={() => setIsSignedIn(false)} />
    : <RootStack onSignIn={() => setIsSignedIn(true)} />;
}