import { useState } from 'react';
import { ScrollView, Text, View, Image, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getItem } from './SecureStore';
import { fetchWithTimeout } from './utils';
import type { ClothingItem } from './Closet';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function LaundryScreen() {
  const [dirtyItems, setDirtyItems] = useState<ClothingItem[]>([]);

  useFocusEffect(() => {
    async function fetchDirtyItems() {
      try {
        const token = await getItem("token");
        if (!token) return;

        const response = await fetchWithTimeout(`${API_URL}/clothing`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        const dirty = data.items.filter((item: ClothingItem) => item.status === "dirty");
        setDirtyItems(dirty);
      } catch (err) {
        console.error(err);
      }
    }

    fetchDirtyItems();
  });

  return (
    <ScrollView>
      <Text style={laundryStyle.title}>Laundry</Text>
      {dirtyItems.length === 0 ? (
        <Text style={laundryStyle.emptyText}>No dirty items! You're all caught up 🎉</Text>
      ) : (
        dirtyItems.map((item) => (
          <View key={item.id} style={laundryStyle.itemContainer}>
            {item.primary_photo_uri && (
              <Image
                source={{ uri: `${API_URL}/${item.primary_photo_uri}` }}
                style={laundryStyle.image}
              />
            )}
            <Text style={laundryStyle.itemName}>{item.name}</Text>
            <Text style={laundryStyle.itemCategory}>{item.category}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const laundryStyle = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  emptyText: {
    alignSelf: 'center',
    marginTop: 40,
    fontSize: 16,
    color: 'grey',
  },
  itemContainer: {
    backgroundColor: '#f8f8f8',
    margin: 10,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  itemCategory: {
    fontSize: 14,
    color: 'grey',
  },
});

export default LaundryScreen;