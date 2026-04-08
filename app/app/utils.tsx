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
              <Picker.Item label="Clothing Type" value={null} enabled={false}/>
              <Picker.Item label="T-Shirt" value="t-shirt"/>
              <Picker.Item label="Long Sleeve" value="long-sleeve"/>
              <Picker.Item label="Button-Up" value="button-up"/>
              <Picker.Item label="Polo" value="polo"/>
              <Picker.Item label="Sweater" value="sweater"/>
              <Picker.Item label="Hoodie" value="hoodie"/>
              <Picker.Item label="Jacket" value="jacket"/>
              <Picker.Item label="Coat" value="coat"/>
              <Picker.Item label="Blazer" value="blazer"/>
              <Picker.Item label="Jeans" value="jeans"/>
              <Picker.Item label="Pants" value="pants"/>
              <Picker.Item label="Shorts" value="shorts"/>
              <Picker.Item label="Skirt" value="skirt"/>
              <Picker.Item label="Dress" value="dress"/>
              <Picker.Item label="Jumpsuit" value="jumpsuit"/>
              <Picker.Item label="Suit" value="suit"/>
              <Picker.Item label="Activewear" value="activewear"/>
              <Picker.Item label="Sleepwear" value="sleepwear"/>
              <Picker.Item label="Underwear" value="underwear"/>
              <Picker.Item label="Shoes" value="shoes"/>
            </Picker>
            <Picker mode="dropdown" selectedValue={primaryColor} onValueChange={(itemValue) => setPrimaryColor(itemValue)}>
              <Picker.Item label="PrimaryColor" value={null} enabled={false}/>
              <Picker.Item label="Black" value="black"/>
              <Picker.Item label="White" value="white"/>
              <Picker.Item label="Gray" value="gray"/>
              <Picker.Item label="Blue" value="blue"/>
              <Picker.Item label="Green" value="green"/>
              <Picker.Item label="Red" value="red"/>
              <Picker.Item label="Pink" value="pink"/>
              <Picker.Item label="Purple" value="purple"/>
              <Picker.Item label="Yellow" value="yellow"/>
              <Picker.Item label="Orange" value="orange"/>
              <Picker.Item label="Brown" value="brown"/>
              <Picker.Item label="Beige" value="beige"/>
              <Picker.Item label="Teal" value="teal"/>
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