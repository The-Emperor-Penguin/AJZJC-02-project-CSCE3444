import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { CreateAccountScreen, LoginScreen, ResetPasswordScreen, handleSignOut } from "./Authentication";
import { recommendationScreen } from "./Recommendations"
import { historyScreen } from './History';
import { AddClothing, ClosetScreen } from './Closet';
import { SettingsScreen } from './Settings';
import { deleteItem, getItem } from './SecureStore';

const Tab = createBottomTabNavigator(); //Creates navigation flow object

//Create navigation tab object
function NavigationTab({ onSignOut }: { onSignOut: () => void | Promise<void> }) {
  return (
    //This is all the main screens associated with the app
    <Tab.Navigator> 
      <Tab.Screen
        name="Recommendations"
        component={recommendationScreen}
      />
      <Tab.Screen
        name="Closet"
        component={ClosetScreen}
      />
      <Tab.Screen
        name="History"
        component={historyScreen}
      />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );

}

//Define the RootStack types
type RootStackParamList = {  
  'Create Account': undefined;  
  'Login': undefined;  
  'Reset Password': undefined;
  'Main View': undefined;
};  

const Stack = createNativeStackNavigator<RootStackParamList>(); //Create stack object

//Define RootStack
function RootStack({ onSignIn, onSignOut }: { onSignIn: () => void, onSignOut: () => void | Promise<void> }) {
  return (
    //This is all the screens associated with authentication.
    <Stack.Navigator initialRouteName='Create Account'>
      <Stack.Screen name="Create Account">
        {() => <CreateAccountScreen onSignIn={onSignIn} />}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {() => <LoginScreen onSignIn={onSignIn} />}
      </Stack.Screen>
      <Stack.Screen name="Reset Password" component={ResetPasswordScreen} />
      <Stack.Screen name="Main View" component={() => <NavigationTab onSignOut={onSignOut}/>}/>
    </Stack.Navigator>
  );
}

//Main App function
export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // This function ensures that the token is destroyed when the user signs out

  useEffect(() => {
    let isMounted = true;

    //TODO: Create Error handling for expired tokens
    async function loadAuthState() {
      const token = await getItem("token"); //Get token
      if (!isMounted) return;
      setIsSignedIn(token !== null); //If signed in then set sign in to true
      setIsLoadingAuth(false); //If signed in loading auth is false
    }

    loadAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoadingAuth) return null;

 const onSignOut = () => handleSignOut({ setIsSignedIn });

  //Automatically switch navigation objects once the user is logged in.
  return <RootStack onSignIn={() => setIsSignedIn(true)} onSignOut={onSignOut}/>;
}