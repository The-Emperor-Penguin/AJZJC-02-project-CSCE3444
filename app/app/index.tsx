import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View, TextInput, Alert} from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@react-navigation/elements';
import { useState } from 'react';

function CheckPasswords(password: string, repassword:string) {
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

function OnAccountCreation(email: string, password: string, repassword: string) {
  email = email.toLowerCase(); // All emails are case insensitive, as such we can make the entire thing lowercase.
  if (!CheckEmail(email)) {
    Alert.alert("Warning Email is not valid");
    return;
  }
  else if (!CheckPasswords(password, repassword)) {
    Alert.alert("Passwords are not equal!!"); // See if passwords match
    return;
  }
  //TODO: Send Data to server to create account

  //Continue since no account creation for server yet
  Alert.alert("Everything is fine\nWe are currently working on this.");

}

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const [repasswd, setRepasswd] = useState('');
  
  return (
    <View style={styles.container}>
      <Text>Create Account</Text>
      <TextInput style={styles.input} autoComplete='email' inputMode='email' maxLength={128} value={email} onChangeText={setEmail} placeholder='Email'/>
      <TextInput style={styles.input} autoComplete='new-password' secureTextEntry={true} maxLength={28} value={passwd} onChangeText={setPasswd} placeholder='Password'/>
      <TextInput style={styles.input} autoComplete='new-password' secureTextEntry={true} maxLength={28} value={repasswd} onChangeText={setRepasswd} placeholder='Re-enter password'/>
      <Button onPress={() => OnAccountCreation(email, passwd, repasswd)} style={styles.buttons}>Create Account</Button>
      <Button style={styles.buttons}>Already have an account?</Button>
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