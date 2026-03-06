import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateAccountScreen, LoginScreen, ResetPasswordScreen } from "./Authentication";
import { RecommendationScreen } from "./Recommendations"

type RootStackParamList = {  
  'Create Account': undefined;  
  'Login': undefined;  
  'Reset Password': undefined;  
  'Recommendations': undefined;  
};  

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack() {
  return (
    //TODO: Change initial route name to home screen if already logged in
    <Stack.Navigator initialRouteName='Create Account'>
      <Stack.Screen name="Create Account" component={CreateAccountScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Reset Password" component={ResetPasswordScreen} />
      <Stack.Screen name="Recommendations" component={RecommendationScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
      <RootStack />
  );
}