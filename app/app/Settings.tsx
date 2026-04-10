import React, { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "./index";


// GLOBAL STATE (moved outside component)
let darkModeState = false;
let paletteState = "blue";

// GETTER
export const getSettings = () => {
  return {
    darkMode: darkModeState,
    palette: paletteState,
  };
};

// SETTERS
export const setDarkModeGlobal = (value: boolean) => {
  darkModeState = value;
};

export const setPaletteGlobal = (value: string) => {
  paletteState = value;
};


type SettingProps = {
  onSignOut?: () => void | Promise<void>;
  username?: string;
  email?: string;
};

export function SettingsScreen({ onSignOut, username = 'John Doe', email = 'johndoe@example.com' }: SettingProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // initialize from global state
  const [darkMode, setDarkMode] = useState(darkModeState);
  const [notifications, setNotifications] = useState(true);
  const [formality, setFormality] = useState("Neutral");
  const [palette, setPalette] = useState(paletteState);
const paletteColors: any = {
  blue: "#38bdf8",
  yellow: "#facc15",
  green: "#10b981"
};

const primary = paletteColors[palette] || "#38bdf8";

const dynamicStyles = {
  container: {
    backgroundColor: darkMode ? "#0f172a" : "#ffffff"
  },
  text: {
    color: darkMode ? "#ffffff" : "#000000"
  },
  card: {
    backgroundColor: darkMode ? "#1e293b" : "#f1f5f9"
  }
};
  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      <View style={{ padding: 20 }}>

        {/* Account Info */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Account Info</Text>
          <Text style={styles.accountName}>{username}</Text>
          <Text style={styles.accountEmail}>{email}</Text>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={[styles.card, dynamicStyles.card]}>
          <SettingItem
            dynamicStyles={dynamicStyles}
            primary={primary}
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate("Edit Profile")}
          />
          <SettingItem
            dynamicStyles={dynamicStyles}
            primary={primary}
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => navigation.navigate("Change Password")}
          />
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <SettingToggle
            dynamicStyles={dynamicStyles}
            primary={primary}
            icon="moon-outline"
            label="Dark Mode"
            value={darkMode}
            onValueChange={(val: boolean) => {
              setDarkMode(val);
              setDarkModeGlobal(val); // update global
            }}
          />
          <SettingToggle
            dynamicStyles={dynamicStyles}
            primary={primary}
            icon="notifications-outline"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* Formality Section */}
        <Text style={styles.sectionTitle}>Formality</Text>
        <View style={[styles.card, styles.rowBetween]}>
          {["Casual", "Neutral", "Formal"].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.formalityOption,
                formality === option && styles.selectedOption
              ]}
              onPress={() => setFormality(option)}
            >
              <Text style={styles.label}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color Palette Section */}
        <Text style={styles.sectionTitle}>Color Palette</Text>
        <View style={[styles.card, styles.rowGap]}>
          {[
            { name: 'blue', color: '#38bdf8' },
            { name: 'yellow', color: '#facc15' },
            { name: 'green', color: '#10b981' }
          ].map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.colorOption,
                { backgroundColor: item.color },
                palette === item.name && styles.selectedColor
              ]}
              onPress={() => {
                setPalette(item.name);
                setPaletteGlobal(item.name); //update global
              }}
            />
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => onSignOut?.()}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SettingItem({ icon, label, onPress, dynamicStyles, primary }: any) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={primary} />
        <Text style={[styles.label, dynamicStyles.text]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function SettingToggle({ icon, label, value, onValueChange, dynamicStyles, primary }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={primary} />
        <Text style={[styles.label, dynamicStyles.text]}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  sectionTitle: { color: '#94a3b8', marginTop: 20, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: 'white', fontSize: 16 },
  logoutButton: { marginTop: 30, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: 'bold' },
  accountName: { color: 'white', fontSize: 20, fontWeight: '600' },
  accountEmail: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  colorOption: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#1e293b' },
  selectedColor: { borderColor: 'white', borderWidth: 3 },
  formalityOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#334155' },
  selectedOption: { backgroundColor: '#38bdf8' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  rowGap: { flexDirection: 'row', gap: 10, paddingVertical: 15 }
});




