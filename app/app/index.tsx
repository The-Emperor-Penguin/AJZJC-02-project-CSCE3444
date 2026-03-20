import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { CreateAccountScreen, LoginScreen, ResetPasswordScreen } from "./Authentication";
import { RecommendationScreen } from "./Recommendations"
import { HistoryScreen } from './History';
import { ClosetScreen } from './Closet';
import { SettingsScreen } from './Settings';
import { deleteItem, getItem } from './SecureStore';

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

function NavigationTab({ onSignOut }: { onSignOut: () => void | Promise<void> }) {
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
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );

}

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  async function handleSignOut() {
    await deleteItem("token");
    setIsSignedIn(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAuthState() {
      const token = await getItem("token");
      if (!isMounted) return;
      setIsSignedIn(token !== null);
      setIsLoadingAuth(false);
    }

    loadAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoadingAuth) return null;

  return isSignedIn
    ? <NavigationTab onSignOut={handleSignOut} />
    : <RootStack onSignIn={() => setIsSignedIn(true)} />;
}