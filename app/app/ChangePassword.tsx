import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert } from 'react-native';
import { Button } from '@react-navigation/elements';
import { getItem } from './AppStorage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './index';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function ChangePasswordScreen() {
  // Variables for password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  async function handleChangePassword() {
    // Make sure all of the fields are filled out
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Make sure the new passwords match before sending to server
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    try {
      // Get token from SecureStore
      const token = await getItem("token");
      if (!token) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      // Send change password request to the server
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      // If the server returns an error, show it to the user
      if (!response.ok) {
        console.error(data.error);
        Alert.alert("Error", "Could not change password");
        return;
      }

      // On Success, clear the fields and let the user know
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert("Success", "Password changed successfully!", [{text: "OK", onPress: () => navigation.goBack()}]);


    } catch (err) {
      console.error(err);
      Alert.alert("Network Error", "Could not connect to server.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Password</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Enter current password"
        secureTextEntry={true}
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Enter new password"
        secureTextEntry={true}
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter new password"
        secureTextEntry={true}
      />

      <Button onPress={handleChangePassword}>Change Password</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 20,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    color: '#000000',
  }
});

export default ChangePasswordScreen;