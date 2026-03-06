import { StyleSheet, Text, View, TextInput, Alert} from 'react-native';
import { Button } from '@react-navigation/elements';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  'Create Account': undefined;
  Login: undefined;
  Recommendations: undefined;
  'Reset Password': undefined;
};

type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;

//TODO: finish reset password after backend is ready
function ResetPassword(email: string, navigation: RootStackNavigation){
  if (!CheckEmail(email)) Alert.alert("Email is not valid");
  else {
      //TODO: Write reset password section

      Alert.alert("Reset password would be sent but this it a WIP");
      navigation.popTo("Login");
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
  const re = /[ ]/;
  const ok = re.exec(password);
  if (ok !== null) return false;
  if ((password.trim() === "") || (repassword.trim() === "")) return false;
  if (password === repassword) {
    return true;
  }
  else return false;
}

function CheckEmail(email: string) {
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/; // Regex to check if it is a email.
  const ok = re.exec(email);
  if (ok === null) return false;
  else return true;
  

}
//TODO: Finish account creation after backend is ready
function OnAccountCreation(email: string, password: string, repassword: string, navigation: RootStackNavigation) {
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

  //Continue since no account creation for server yet
  Alert.alert("Account not created, account managements is a TODO");
  navigation.popTo("Recommendations");

}
//TODO Finish Account login after backend is ready
function OnAccountLogin(email: string, password: string, navigation: RootStackNavigation) {
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
  navigation.popTo("Recommendations");
}

export function CreateAccountScreen() {
  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const [repasswd, setRepasswd] = useState('');
  const navigation = useNavigation<RootStackNavigation>();

  const handlePasswordChange = (newText: string, isRePasswd = false) => {
    // Example: Prevent everything except letters and numbers
    const filteredText = newText.replace(/[^a-zA-Z0-9]/g, '');
    if (isRePasswd) setRepasswd(filteredText);
    else setPasswd(filteredText);
  };
  const handleRePasswordChange = (newText: string) => {
    // Example: Prevent everything except letters and numbers
    const filteredText = newText.replace(/[^a-zA-Z0-9]/g, '');
    setRepasswd(filteredText);
  };
  
  return (
    <View style={styles.container}>
      <Text>Create Account</Text>
      <TextInput style={styles.input} autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
      <TextInput style={styles.input}  autoComplete='new-password' secureTextEntry={true} maxLength={28} value={passwd} onChangeText={handlePasswordChange} placeholder='Password'/>
      <TextInput style={styles.input} autoComplete='new-password' secureTextEntry={true} maxLength={28} value={repasswd} onChangeText={handleRePasswordChange} placeholder='Re-enter password'/>
      <Button onPress={() => OnAccountCreation(email, passwd, repasswd, navigation)} style={styles.buttons}>Create Account</Button>
      <Button style={styles.buttons} onPress={() => navigation.popTo('Login')}>Already have an account?</Button>
    </View>
  );   
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const navigation = useNavigation<RootStackNavigation>();

  const handlePasswordChange = (newText: string) => {
    // Example: Prevent everything except letters and numbers
    const filteredText = newText.replace(/[^a-zA-Z0-9]/g, '');
    setPasswd(filteredText);
  };
  
  return (
    <View style={styles.container}>
      <Text>Create Account</Text>
      <TextInput style={styles.input} autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
      <TextInput style={styles.input} autoComplete='password' secureTextEntry={true} maxLength={28} value={passwd} onChangeText={handlePasswordChange} placeholder='Password'/>
      <Button onPress={() => OnAccountLogin(email, passwd, navigation)} style={styles.buttons}>Login</Button>
      <Button style={styles.buttons} screen="Reset Password" params={{}} >Reset Password?</Button>
      <Button style={styles.buttons} onPress={() => navigation.popTo("Create Account")}>Need to create an account?</Button>
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