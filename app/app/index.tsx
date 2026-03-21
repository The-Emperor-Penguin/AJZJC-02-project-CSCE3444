import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { CreateAccountScreen, LoginScreen, ResetPasswordScreen, handleSignOut } from "./Authentication";
import { RecommendationScreen } from "./Recommendations"
import { HistoryScreen } from './History';
import { AddClothingModal, ClosetScreen, TakePhotoScreen } from './Closet';
import { SettingsScreen } from './Settings';
import { deleteItem, getItem } from './SecureStore';

const Tab = createBottomTabNavigator(); //Creates navigation flow object

//Create navigation tab object
function NavigationTab({ onSignOut }: { onSignOut: () => void | Promise<void> }) {
  return (
    //This is all the main screens associated with the app
    <Tab.Navigator initialRouteName='Recommendations'> 
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

//Define the RootStack types
export type RootStackParamList = {  
  'Create Account': undefined;  
  'Login': undefined;  
  'Reset Password': undefined;
  'Main View': undefined;
  'Add Clothing': undefined;
  'Take Photo': undefined;
};  

const Stack = createNativeStackNavigator<RootStackParamList>(); //Create stack object

//Define RootStack
function RootStack({ isSignedIn, onSignIn, onSignOut, }:
   { isSignedIn: boolean;onSignIn: () => void; onSignOut: () => void | Promise<void>; }) {
  return (
    <Stack.Navigator>
      {isSignedIn ? (
        <>
          <Stack.Screen name="Main View" options={{headerShown: false}}>
            {() => <NavigationTab onSignOut={onSignOut} />}
          </Stack.Screen>
          <Stack.Screen
            name="Add Clothing"
            component={AddClothingModal}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="Take Photo" component={TakePhotoScreen} options={{ presentation: 'modal'}}/>
        </>
      ) : (
        <>
          <Stack.Screen name="Create Account">
            {() => <CreateAccountScreen onSignIn={onSignIn} />}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {() => <LoginScreen onSignIn={onSignIn} />}
          </Stack.Screen>
          <Stack.Screen name="Reset Password" component={ResetPasswordScreen} />
        </>
      )}
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
  return (
  <RootStack
    isSignedIn={isSignedIn}
    onSignIn={() => setIsSignedIn(true)}
    onSignOut={onSignOut}
  />
);
}