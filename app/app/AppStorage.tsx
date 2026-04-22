import * as SecureStore from 'expo-secure-store';
import asyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveItem(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string) {
    let result = await SecureStore.getItemAsync(key);
    return result;
}

export async function deleteItem(key: string) {
  await SecureStore.deleteItemAsync(key);
}

export async function saveInsecureItem(key: string, value:string) {
  await AsyncStorage.setItem(key, value);
}

export async function getInsecureItem(key: string) {
  const value = await AsyncStorage.getItem(key);
  return value
}
export async function deleteInsecureItem(key: string) {
  await AsyncStorage.removeItem(key);
}