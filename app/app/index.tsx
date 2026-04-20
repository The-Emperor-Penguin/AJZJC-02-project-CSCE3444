import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { CreateAccountScreen, LoginScreen, ResetPasswordScreen, EnterResetCodeScreen, SetNewPasswordScreen, handleSignOut } from "./Authentication";
import { RecommendationScreen } from "./Recommendations"
import { HistoryScreen } from './History';
import { AddClothingModal, ClosetScreen, ClothingItemScreen } from './Closet';
import { SettingsScreen } from './Settings';
import { ThemeSettingsProvider, useThemeSettings, createThemeStyles } from './Theme';
import { deleteItem, getItem } from './AppStorage';
import type { RouteProp } from '@react-navigation/native';
import { ClothingItem, EditClothingScreen } from "./Closet";
import { ProfileScreen } from './Profile';
import { ChangePasswordScreen } from './ChangePassword';
import { StatusBar } from 'react-native';
import { LaundryScreen } from './Laundry';

const Tab = createBottomTabNavigator(); //Creates navigation flow object

//Create navigation tab object
function NavigationTab({ onSignOut }: { onSignOut: () => void | Promise<void> }) {
  const { darkMode, palette } = useThemeSettings();
  const dynamicStyle = createThemeStyles(darkMode, palette);
  return (
    //This is all the main screens associated with the app
    <Tab.Navigator
      initialRouteName='Recommendations'
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: dynamicStyle.container.backgroundColor,
          borderTopColor: darkMode ? '#334155' : '#e2e8f0',
        },
        headerStyle: {
          backgroundColor: darkMode ? "#172137" : "#ffffff"
        },
        headerTintColor: darkMode ? '#38bdf8' : '#0a7ea4',
        headerTitleStyle: {
          color: darkMode ? '#ffffff' : '#000000',
        },
        headerShadowVisible: true,
        tabBarActiveTintColor: darkMode ? '#38bdf8' : '#0a7ea4',
        tabBarInactiveTintColor: darkMode ? '#94a3b8' : '#687076',
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof FontAwesome5.glyphMap = 'circle';

          if (route.name === 'Recommendations') iconName = 'magic';
          else if (route.name === 'Closet') iconName = 'tshirt';
          else if (route.name === 'History') iconName = 'history';
          else if (route.name === 'Laundry') iconName = 'trash-alt';
          else if (route.name === 'Settings') iconName = 'cog';

          return <FontAwesome5 name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Recommendations"
        component={RecommendationScreen}
        options={{
          headerShown: true,
          headerTitle: "Today's Recommendations"
        }}
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
        name="Laundry"
        component={LaundryScreen}
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
  'Enter Reset Code': { email: string };
  'Set New Password': { email: string };
  'Main View': undefined;
  'Add Clothing': undefined;
  'Edit Profile': undefined;
  'Change Password': undefined;
  'Edit Clothing Screen': {item: ClothingItem};
  'Clothing Item Screen': {item: ClothingItem};
};  

const Stack = createNativeStackNavigator<RootStackParamList>(); //Create stack object

//Define RootStack
function RootStack({ isSignedIn, onSignIn, onSignOut, }:
   { isSignedIn: boolean;onSignIn: () => void; onSignOut: () => void | Promise<void>; }) {
  const { darkMode, palette } = useThemeSettings();
  const dynamicStyle = createThemeStyles(darkMode, palette);

  return (
    <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: dynamicStyle.container.backgroundColor,
      },
      headerTintColor: darkMode ? '#38bdf8' : '#0a7ea4',
      headerTitleStyle: {
        color: darkMode ? '#ffffff' : '#000000',
      },
      headerShadowVisible: false,
    }}>
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
          <Stack.Screen
            name="Edit Profile"
            component={ProfileScreen}
            options={{ presentation: 'modal'}}
          />
          <Stack.Screen
              name="Change Password"
              component={ChangePasswordScreen}
              options={{ presentation: 'modal'}}
              />
          <Stack.Screen
            name="Edit Clothing Screen"
            component={({ route }: { route: RouteProp<RootStackParamList, 'Edit Clothing Screen'> }) => <EditClothingScreen {...route.params.item}/>}
            options={{ presentation: 'modal'}}
          />
          <Stack.Screen
            name="Clothing Item Screen"
            component={({ route }: { route: RouteProp<RootStackParamList, 'Clothing Item Screen'> }) => <ClothingItemScreen {...route.params.item}/>}
            options={{ presentation: 'modal'}}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Create Account" options={{ headerShown: false }}>
            {() => <CreateAccountScreen onSignIn={onSignIn} />}
          </Stack.Screen>
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {() => <LoginScreen onSignIn={onSignIn} />}
          </Stack.Screen>
          <Stack.Screen name="Enter Reset Code" options={{ headerTitle: '' }} component={EnterResetCodeScreen} />
          <Stack.Screen name="Set New Password" options={{ headerTitle: '' }} component={SetNewPasswordScreen} />
          <Stack.Screen name="Reset Password" options={{ headerTitle: '' }} component={ResetPasswordScreen} />
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
    <ThemeSettingsProvider>
      <RootStack
        isSignedIn={isSignedIn}
        onSignIn={() => setIsSignedIn(true)}
        onSignOut={onSignOut}
      />
    </ThemeSettingsProvider>
);
}