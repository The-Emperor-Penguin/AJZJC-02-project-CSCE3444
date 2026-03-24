// AI Assisted (Claude by Anthropic)
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Button } from '@react-navigation/elements';
import { Picker } from '@react-native-picker/picker';
import { getItem } from './SecureStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function ProfileScreen() {
  // State variables for all profile fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [formalityPreference, setFormalityPreference] = useState('casual');
  const [loading, setLoading] = useState(true);

  // Fetch the user's current profile when the screen loads
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      // Get the token from SecureStore
      const token = await getItem("token");
      if (!token) return;

      // Fetch the user's profile from the server
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", data.error || "Could not load profile");
        return;
      }

      // Populate the fields with the user's current info
      setDisplayName(data.user.display_name || '');
      setEmail(data.user.email || '');
      setCity(data.user.city || '');
      setState(data.user.state || '');
      setFormalityPreference(data.user.formality_preference || 'casual');

    } catch (err) {
      Alert.alert("Network Error", "Could not connect to server.");
    } finally {
      // Stop the loading spinner
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      const token = await getItem("token");
      if (!token) return;

      // Send the updated profile to the server
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: displayName,
          city: city,
          state: state,
          formality_preference: formalityPreference
        })
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", data.error || "Could not update profile");
        return;
      }

      Alert.alert("Success", "Profile updated!");

    } catch (err) {
      Alert.alert("Network Error", "Could not connect to server.");
    }
  }

  // Show a loading spinner while fetching profile
  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Enter display name"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.readOnly]}
        value={email}
        editable={false}
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="Enter city"
      />

      <Text style={styles.label}>State</Text>
      <TextInput
        style={styles.input}
        value={state}
        onChangeText={setState}
        placeholder="Enter state"
      />

      <Text style={styles.label}>Default Formality</Text>
      <Picker
        selectedValue={formalityPreference}
        onValueChange={(value) => setFormalityPreference(value)}
      >
        <Picker.Item label="Casual" value="casual" />
        <Picker.Item label="Smart Casual" value="smart_casual" />
        <Picker.Item label="Business" value="business" />
        <Picker.Item label="Formal" value="formal" />
      </Picker>

      <Button onPress={saveProfile}>Save Profile</Button>
      <Button onPress={() => Alert.alert("Coming Soon", "Change password coming soon!")}>
        Change Password
      </Button>
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
  },
  readOnly: {
    backgroundColor: '#f0f0f0',
    color: 'grey',
  }
});

export default ProfileScreen;