import React, { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "./index";

type SettingProps = {
  onSignOut?: () => void | Promise<void>;
  username?: string;
  email?: string;
};

export function SettingsScreen({ onSignOut, username = 'John Doe', email = 'johndoe@example.com' }: SettingProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [formality, setFormality] = useState(true);
  const [palette, setPalette] = useState("blue");

  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: 20 }}>

        {/* Account Info */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.accountName}>{username}</Text>
          <Text style={styles.accountEmail}>{email}</Text>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate("Edit Profile")}
          />
          <SettingItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => navigation.navigate("Change Password")}
          />
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <SettingToggle
            icon="moon-outline"
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingToggle
            icon="notifications-outline"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingToggle
            icon="text-outline"
            label="Default Formality"
            value={formality}
            onValueChange={setFormality}
          />
        </View>

        {/* Color Palette Section */}
        <Text style={styles.sectionTitle}>Color Palette</Text>
        <View style={[styles.card, { flexDirection: 'row', gap: 10, paddingVertical: 15 }]}>
          <TouchableOpacity style={[styles.colorOption, { backgroundColor: '#38bdf8' }]} onPress={() => setPalette('blue')} />
          <TouchableOpacity style={[styles.colorOption, { backgroundColor: '#facc15' }]} onPress={() => setPalette('yellow')} />
          <TouchableOpacity style={[styles.colorOption, { backgroundColor: '#10b981' }]} onPress={() => setPalette('green')} />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => onSignOut?.()}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SettingItem({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color="#38bdf8" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function SettingToggle({ icon, label, value, onValueChange }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color="#38bdf8" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { color: '#94a3b8', marginTop: 20, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: 'white', fontSize: 16 },
  logoutButton: { marginTop: 30, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: 'bold' },
  accountName: { color: 'white', fontSize: 20, fontWeight: '600' },
  accountEmail: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  colorOption: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#1e293b' }
});


