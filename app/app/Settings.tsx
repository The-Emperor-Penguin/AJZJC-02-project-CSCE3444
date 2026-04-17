import React, { createContext, useContext, useEffect, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "./index";
import { useThemeSettings, createThemeStyles } from "./Theme";


const paletteColors: Record<string, string> = {
  "blue": "#38bdf8",
  "yellow": "#facc15",
  "green": "#10b981",
};


type SettingProps = {
  onSignOut?: () => void | Promise<void>;
  username?: string;
  email?: string;
};

export function SettingsScreen({ onSignOut, username = 'John Doe', email = 'johndoe@example.com' }: SettingProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();

  const [notifications, setNotifications] = useState(true);
  const [formality, setFormality] = useState("Neutral");

  let dynamicStyle = createThemeStyles(darkMode, palette);

  return (
    <ScrollView style={[styles.container, dynamicStyle.container]}>
      <View style={{ padding: 20 }}>

        {/* Account Info */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, dynamicStyle.text]}>Account Info</Text>
          <Text style={[styles.accountName, dynamicStyle.text]}>{username}</Text>
          <Text style={[styles.accountEmail, dynamicStyle.text]}>{email}</Text>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={[styles.card, dynamicStyle.card]}>
          <SettingItem
            dynamicStyle={dynamicStyle}
            primary={paletteColors[palette]}
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate("Edit Profile")}
          />
          <SettingItem
            dynamicStyle={dynamicStyle}
            primary={paletteColors[palette]}
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => navigation.navigate("Change Password")}
          />
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.card, dynamicStyle.card]}>
          <SettingToggle
            dynamicStyle={dynamicStyle}
            primary={paletteColors[palette]}
            icon="moon-outline"
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <SettingToggle
            dynamicStyle={dynamicStyle}
            primary={paletteColors[palette]}
            icon="notifications-outline"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* Formality Section */}
        <Text style={styles.sectionTitle}>Formality</Text>
        <View style={[styles.card, styles.rowBetween, dynamicStyle.card]}>
          {["Casual", "Neutral", "Formal"].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                [styles.formalityOption, dynamicStyle.pressables],
                formality === option && dynamicStyle.selectedPressable
              ]}
              onPress={() => setFormality(option)}
            >
              <Text style={[styles.label, dynamicStyle.text]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color Palette Section */}
        <Text style={styles.sectionTitle}>Color Palette</Text>
        <View style={[styles.card, styles.rowGap, dynamicStyle.card]}>
          {[
            { name: 'blue', color: '#38bdf8' },
            { name: 'yellow', color: '#facc15' },
            { name: 'green', color: '#10b981' }
          ].map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.colorOption,
                dynamicStyle.notSelectedColor,
                { backgroundColor: item.color },
                palette === item.name && dynamicStyle.selectedColor
              ]}
              onPress={() => {
                setPalette(item.name);
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

function SettingItem({ icon, label, onPress, dynamicStyle, primary }: any) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={primary} />
        <Text style={[styles.label, dynamicStyle.text]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function SettingToggle({ icon, label, value, onValueChange, dynamicStyle, primary }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={primary} />
        <Text style={[styles.label, dynamicStyle.text]}>{label}</Text>
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
  formalityOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  selectedOption: { backgroundColor: '#38bdf8' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  rowGap: { flexDirection: 'row', gap: 10, paddingVertical: 15 }
});



export default SettingsScreen;
