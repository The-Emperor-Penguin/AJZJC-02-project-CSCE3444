import { View, Text, Alert, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from 'expo-image-picker';

export async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function userPickImage(setImage: (value: string | null) => void, setImageMimeType: (value: string | null) => void) {
  //Get permission for media library
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //If permission isn't granted alert user
  if (!permissionResult.granted) {
    Alert.alert('Permission required', 'Permission to access the media library is required.');
    return;
  }
  //Get image from user
  let result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3], //Leaving as 4:3 for now
    quality: 1,
  });
  //If image isn't canceled then set states for image and mimeType
  if (!result.canceled) {
    setImage(result.assets[0].uri);
    setImageMimeType(result.assets[0].mimeType ?? null);
  }
}


interface PickerTagsProps {
  clothingType: string | null;
  setClothingType: (value: string | null) => void;
  primaryColor: string | null;
  setPrimaryColor: (value: string | null) => void;
}

const clothingTypeMap: Record<string, string> = {
  't-shirt': 'T-Shirt',
  'long-sleeve': 'Long Sleeve',
  'button-up': 'Button-Up',
  'polo': 'Polo',
  'sweater': 'Sweater',
  'hoodie': 'Hoodie',
  'jacket': 'Jacket',
  'coat': 'Coat',
  'blazer': 'Blazer',
  'jeans': 'Jeans',
  'pants': 'Pants',
  'shorts': 'Shorts',
  'skirt': 'Skirt',
  'dress': 'Dress',
  'jumpsuit': 'Jumpsuit',
  'suit': 'Suit',
  'activewear': 'Activewear',
  'sleepwear': 'Sleepwear',
  'underwear': 'Underwear',
  'shoes': 'Shoes',
};

const colorMap: Record<string, string> = {
  'black': 'Black',
  'white': 'White',
  'gray': 'Gray',
  'blue': 'Blue',
  'green': 'Green',
  'red': 'Red',
  'pink': 'Pink',
  'purple': 'Purple',
  'yellow': 'Yellow',
  'orange': 'Orange',
  'brown': 'Brown',
  'beige': 'Beige',
  'teal': 'Teal',
};

const pickMap: Record<string, string> = {
  ...clothingTypeMap,
  ...colorMap,
};

export function pickerToTag(pickerElement: string) {
  return pickMap[pickerElement] ?? pickerElement;
}

export function PickerTags({
  clothingType,
  setClothingType,
  primaryColor,
  setPrimaryColor,
}: PickerTagsProps) {
  return (
    <View>
      <Picker style={pickerStyle.picker} mode="dropdown" selectedValue={clothingType} onValueChange={(itemValue) => setClothingType(itemValue)}>
        <Picker.Item label="Clothing Type" value={null} enabled={false} />
        {Object.entries(clothingTypeMap).map(([value, label]) => (
          <Picker.Item key={value} label={label} value={value} />
        ))}
      </Picker>
      <Picker mode="dropdown" style={pickerStyle.picker} selectedValue={primaryColor} onValueChange={(itemValue) => setPrimaryColor(itemValue)}>
        <Picker.Item label="Primary Color" value={null} enabled={false} />
        {Object.entries(colorMap).map(([value, label]) => (
          <Picker.Item key={value} label={label} value={value} />
        ))}
      </Picker>
    </View>
  )
}

const pickerStyle = StyleSheet.create({
  picker: {
    marginTop: 24,
    marginLeft: 12,
    marginRight: 12,
  }
})