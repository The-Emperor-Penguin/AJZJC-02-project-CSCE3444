import { StyleSheet, Text, View, TextInput, Alert} from 'react-native';
import { Button } from '@react-navigation/elements';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { saveItem } from './SecureStore'

const API_URL=process.env.EXPO_PUBLIC_API_URL;

type RootStackParamList = {
  'Create Account': undefined;
  Login: undefined;
  Recommendations: undefined;
  'Reset Password': undefined;
};

type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;

type AuthScreenProps = {
  onSignIn?: () => void;
};

//TODO: finish reset password after backend is ready
function ResetPassword(email: string, navigation: RootStackNavigation){
  email = email.toLowerCase()
  if (!CheckEmail(email)) Alert.alert("Email is not valid");
  else {
      //TODO: Write reset password section

      Alert.alert("Reset password would be sent but this it's a WIP");
      navigation.replace("Login");
  }
}

export function ResetPasswordScreen() {
    const navigation = useNavigation<RootStackNavigation>();
    const [email, setEmail] = useState('');
    return (
        <View style={styles.container}>
            <Text>Reset Password</Text>
            <TextInput style={styles.input} autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
            <Button onPress={() => ResetPassword(email, navigation)} style={styles.buttons}>Reset Password</Button>
        </View>
    );
}

function CheckPasswords(password: string, repassword:string) {
  const re = /^[a-zA-Z0-9]+$/;
  const ok = re.exec(password);
  if (ok === null) return false;
  if ((password.trim() === "") || (repassword.trim() === "")) return false;
  if (password === repassword) {
    return true;
  }
  else return false;
}

function CheckEmail(email: string) {
  email = email.toLowerCase()
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/; // Regex to check if it is a email.
  const ok = re.exec(email);
  if (ok === null) return false;
  else return true;
  

}
//TODO: Finish account creation after backend is ready
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
  //TODO: Send Data to server to create account
  try {
    //portions of code below developed with AI assistance
    //Send registration request to the server with email and password
    const response = await fetch(`${API_URL}/auth/register`, {
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

    //Account created and token received, sends the user straight to the app
    console.log("Token:", data.token);
    saveItem("token", data.token)
    onSignIn?.();
  } catch (err) {

    //if unable to reach the server at all, shows a network error
    Alert.alert("Network Error", "Could not connect to server.");
    console.error(err);
  }

}
//TODO Finish Account login after backend is ready
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
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },  // Tells the server were sending a JSON
      body: JSON.stringify({ email, password }) //Converts the data to JSON format
    });
    const data = await response.json(); //waits for the server's resposne and parse

    //if the server returns error, shows the user
    if (!response.ok) {
      Alert.alert("Login Failed", data.error || "Invalid credentials");
      return;
    }

    //TODO: Store token for future authentication reequests
    console.log("Token:", data.token);  //logs the token (for now)
    saveItem("token", data.token)
    onSignIn?.();  //sends the user to the main app

  } catch (err) {
    //if unable to reach the server at all, shows a network error
    Alert.alert("Network Error", "Could not connect to server.");
  }
}

export function CreateAccountScreen({ onSignIn }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const [repasswd, setRepasswd] = useState('');
  const navigation = useNavigation<RootStackNavigation>();
  
  return (
    <View style={styles.container}>
      <Text>Create Account</Text>
      <TextInput style={styles.input} autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
      <TextInput style={styles.input}  autoComplete='new-password' secureTextEntry={true} maxLength={28} value={passwd} onChangeText={setPasswd} placeholder='Password'/>
      <TextInput style={styles.input} autoComplete='new-password' secureTextEntry={true} maxLength={28} value={repasswd} onChangeText={setRepasswd} placeholder='Re-enter password'/>
      <Button onPress={() => OnAccountCreation(email, passwd, repasswd, onSignIn)} style={styles.buttons}>Create Account</Button>
      <Button style={styles.buttons} onPress={() => navigation.replace('Login')}>Already have an account?</Button>
    </View>
  );   
}

export function LoginScreen({ onSignIn }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const navigation = useNavigation<RootStackNavigation>();
  
  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <TextInput style={styles.input} autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
      <TextInput style={styles.input} autoComplete='password' secureTextEntry={true} maxLength={28} value={passwd} onChangeText={setPasswd} placeholder='Password'/>
      <Button onPress={() => OnAccountLogin(email, passwd, onSignIn)} style={styles.buttons}>Login</Button>
      <Button style={styles.buttons} onPress={() => navigation.navigate('Reset Password')}>Reset Password?</Button>
      <Button style={styles.buttons} onPress={() => navigation.replace("Create Account")}>Need to create an account?</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    alignItems: 'center'
  },
  buttons: {
    padding: 10,
    margin: 10,
    
  },
  input: {
    height: 40,
    width: 200,
    margin: 10,
    borderColor: 'grey',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10
  },

})
export default CreateAccountScreen;