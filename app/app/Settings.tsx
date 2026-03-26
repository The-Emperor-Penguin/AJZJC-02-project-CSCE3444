import React, { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "./index";

type SettingProps = {
  onSignOut?: () => void | Promise<void>;
};

export function SettingsScreen({ onSignOut }: SettingProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [notifications, setNotifications] = useState(true);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 20 }}>
        <Text style={styles.title}>Settings</Text>

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

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <SettingToggle
            icon="notifications-outline"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* Logout */}
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

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#94a3b8",
    marginTop: 20,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 10,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: "white",
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
});

