import { StyleSheet, Text, View, TextInput, Alert} from 'react-native';
import { Button } from '@react-navigation/elements';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RootStackParamList } from './index'
import { saveItem, deleteItem } from './AppStorage'
import { fetchWithTimeout } from './utils';
import { useThemeSettings, createThemeStyles } from './Theme';

const API_URL=process.env.EXPO_PUBLIC_API_URL;

type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;

type AuthScreenProps = {
  onSignIn?: () => void;
};

export async function handleSignOut({setIsSignedIn}: {setIsSignedIn: Dispatch<SetStateAction<boolean>>} ) {
  await deleteItem("token");
  setIsSignedIn(false);
}

async function ResetPassword(email: string, navigation: RootStackNavigation){
  email = email.toLowerCase()
  if (!CheckEmail(email)) {
    Alert.alert("Email is not valid");
    return;
  }
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert("Error", data.error || "Could not send reset email");
      return;
    }

    Alert.alert("Code Sent!", "Check your email for a 6 digit reset code.");
    navigation.navigate("Enter Reset Code", { email });

  } catch (err) {
    Alert.alert("Network Error", "Could not connect to server.");
  }
}

export function ResetPasswordScreen() {
    const navigation = useNavigation<RootStackNavigation>();
    const [email, setEmail] = useState('');
    const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();
    const dynamicStyles = createThemeStyles(darkMode, palette);

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <Text style={[styles.title, dynamicStyles.text]}>Reset Password</Text>
            <TextInput style={[styles.input, dynamicStyles.text]} placeholderTextColor="#717171" autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
            <Button onPress={() => ResetPassword(email, navigation)} style={styles.buttons}>Reset Password</Button>
        </View>
    );
}

// AI Assisted (Claude by Anthropic)
export function EnterResetCodeScreen({ route }: { route: any }) {
  const navigation = useNavigation<RootStackNavigation>();
  const { email } = route.params;
  const [code, setCode] = useState('');
  const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();
  const dynamicStyles = createThemeStyles(darkMode, palette);

  async function handleVerifyCode() {
    if (!code || code.length !== 6) {
      Alert.alert("Error", "Please enter the 6 digit code");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.error || "Invalid or expired code");
        return;
      }

      navigation.navigate("Set New Password", { email });

    } catch (err) {
      Alert.alert("Network Error", "Could not connect to server.");
    }
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.text]}>Enter the 6 digit code sent to your email</Text>
      <TextInput
        style={[styles.input, dynamicStyles.text]}
        placeholder="6 digit code"
        keyboardType="number-pad"
        placeholderTextColor="#717171"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <Button onPress={handleVerifyCode} style={styles.buttons}>Verify Code</Button>
    </View>
  );
}

export function SetNewPasswordScreen({ route }: { route: any }) {
  const navigation = useNavigation<RootStackNavigation>();
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();
  const dynamicStyles = createThemeStyles(darkMode, palette);


  async function handleSetPassword() {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!CheckPasswords(newPassword, confirmPassword)) {
      Alert.alert("Error", "Passwords do not match or are invalid");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.error || "Could not reset password");
        return;
      }

      Alert.alert("Success!", "Your password has been reset.", [
        { text: "OK", onPress: () => navigation.replace("Login") }
      ]);

    } catch (err) {
      Alert.alert("Network Error", "Could not connect to server.");
    }
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.text]}>Set New Password</Text>
      <TextInput
        style={[styles.input, dynamicStyles.text]}
        placeholderTextColor="#717171"
        placeholder="New Password"
        secureTextEntry={true}
        maxLength={28}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={[styles.input, dynamicStyles.text]}
        placeholderTextColor="#717171"
        placeholder="Confirm New Password"
        secureTextEntry={true}
        maxLength={28}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button onPress={handleSetPassword} style={styles.buttons}>Reset Password</Button>
    </View>
  );
}

export function CheckPasswords(password: string, repassword:string) {
  const re = /^[a-zA-Z0-9]+$/;
  const ok = re.exec(password);
  if (ok === null) return false;
  if ((password.trim() === "") || (repassword.trim() === "")) return false;
  if (password === repassword) {
    return true;
  }
  else return false;
}

export function CheckEmail(email: string) {
  email = email.toLowerCase()
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/; // Regex to check if it is a email.
  const ok = re.exec(email);
  if (ok === null) return false;
  else return true;
  

}

async function OnAccountCreation(
  email: string,
  password: string,
  repassword: string,
  onSignIn?: () => void
) {
  email = email.toLowerCase(); // All emails are case insensitive, as such we can make the entire thing lowercase.
  if (!CheckEmail(email)) {
    Alert.alert("Warning Email is not valid");
    return;
  }
  if (!CheckPasswords(password, repassword)) {
    Alert.alert("Passwords are not equal!!"); // See if passwords match
    return;
  }
  try {
    //portions of code below developed with AI assistance
    //Send registration request to the server with email and password
    const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },  // tells the server were sending JSON
      body: JSON.stringify({ email, password }) //converts the data to JSON format
    });
    const data = await response.json();    //wait for the server's response and parse it

    //if the server returns an error, make sure we show it to the user
    if (!response.ok) {
      Alert.alert("Registration Failed", data.error || "Something went wrong");
      return;
    }
    //Save token in SecureStore
    saveItem("token", data.token)
    //Account created and token received, sends the user straight to the app
    onSignIn?.();
  } catch (err) {

    //if unable to reach the server at all, shows a network error
    Alert.alert("Network Error", "Could not connect to server.");
    console.error(err);
  }

}

async function OnAccountLogin(email: string, password: string, onSignIn?: () => void) {
  email = email.toLowerCase(); // All emails are case insensitive, as such we can make the entire thing lowercase.
  if (!CheckEmail(email)) {
    Alert.alert("Warning Email is not valid"); 
    return;
  }
  if (password === "") {
    Alert.alert("Warning password is empty"); // For now the only thing stopping users from logging in is
    // that the password can't be empty
    return;
  }
  try {
    //Sends the login request to the server with email and password
    //portions of code below developed with AI assistance
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },  // Tells the server were sending a JSON
      body: JSON.stringify({ email, password }) //Converts the data to JSON format
    });
    const data = await response.json(); //waits for the server's response and parse

    //if the server returns error, shows the user
    if (!response.ok) {
      Alert.alert("Login Failed", data.error || "Invalid credentials");
      return;
    }

    //Saves the token in SecureStore
    saveItem("token", data.token)
    onSignIn?.();  //sends the user to the main app

  } catch (err) {
    //if unable to reach the server at all, shows a network error
    Alert.alert("Network Error", "Could not connect to server.");
  }
}

export function CreateAccountScreen({ onSignIn }: AuthScreenProps) {

  //Define registration variables and their states.
  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const [repasswd, setRepasswd] = useState('');

  const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();
  const dynamicStyles = createThemeStyles(darkMode, palette);


  //Obtain current navigation so we may switch screens
  const navigation = useNavigation<RootStackNavigation>();
  
  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.text]}>Create Account</Text>
      <TextInput style={[styles.input, dynamicStyles.text]} placeholderTextColor="#717171" autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
      <TextInput style={[styles.input, dynamicStyles.text]} placeholderTextColor="#717171" autoComplete='new-password' secureTextEntry={true} maxLength={28} value={passwd} onChangeText={setPasswd} placeholder='Password'/>
      <TextInput style={[styles.input, dynamicStyles.text]} placeholderTextColor="#717171"  autoComplete='new-password' secureTextEntry={true} maxLength={28} value={repasswd} onChangeText={setRepasswd} placeholder='Re-enter password'/>
      <Button onPress={() => OnAccountCreation(email, passwd, repasswd, onSignIn)} style={styles.buttons}>Create Account</Button>
      <Button style={styles.buttons} onPress={() => navigation.replace('Login')}>Already have an account?</Button>
    </View>
  );   
}

export function LoginScreen({ onSignIn }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const navigation = useNavigation<RootStackNavigation>();
  const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();
  const dynamicStyles = createThemeStyles(darkMode, palette);
  
  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.text]}>Login</Text>
      <TextInput style={[styles.input, dynamicStyles.text]} placeholderTextColor="#717171" autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
      <TextInput style={[styles.input, dynamicStyles.text]} placeholderTextColor="#717171" autoComplete='password' secureTextEntry={true} maxLength={28} value={passwd} onChangeText={setPasswd} placeholder='Password'/>
      <Button onPress={() => OnAccountLogin(email, passwd, onSignIn)} style={styles.buttons}>Login</Button>
      <Button style={styles.buttons} onPress={() => navigation.navigate('Reset Password')}>Reset Password?</Button>
      <Button style={styles.buttons} onPress={() => navigation.replace("Create Account")}>Need to create an account?</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    flex: 1,
    alignItems: 'center'
  },
  buttons: {
    padding: 10,
    margin: 10,
    
  },
  title: {
    fontSize: 18,
    marginBottom: 24,
  },
  input: {
    height: 40,
    width: 200,
    margin: 10,
    borderColor: 'grey',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    color: '#000000'
  },

})
export default CreateAccountScreen;