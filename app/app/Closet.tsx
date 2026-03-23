import { useState } from 'react';
import { Pressable, Image, Text, View, Alert, StyleSheet, TextInput } from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker'
import * as ImagePicker from 'expo-image-picker';
import type { RootStackParamList } from './index';
import { getItem } from './SecureStore';

const API_URL=process.env.EXPO_PUBLIC_API_URL;

type ClosetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main View'>;

function ClothingComponent({name, color, category, image }: ClothingComponentProps) {
  return(
    <View>
      <Text>{name} - {color} - {category}</Text>
    </View>
  )
}

async function ClothingView() {
  try {
    const token = await getItem("token");
    if (!token) {
      Alert.alert("You must be logged in to upload clothing.");
      return;
    }
    const itemsResponse = await fetch(`${API_URL}/clothing`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }});
    console.log(itemsResponse.body);
  } catch (err) {
    Alert.alert("Error getting clothing");
    console.error(err);
  }  
};

interface ClothingComponentProps {
  name: string;
  color: string;
  category: string;
  image: string;
}

export function ClosetScreen() {
    const navigation = useNavigation<ClosetScreenNavigationProp>();

    ClothingView();

    return(
        <View>
            <View>
                <ClothingComponent name='Test' color = 'Blue' category='t-shirt' image=''/>
            </View>
            <View>
                <Button onPress={() => navigation.navigate('Add Clothing')}>Add Clothing</Button>
            </View>
        </View>
    )
}

async function uploadImage(image: string, imageMimeType: string | null, token: string, createItemData: { id: number }) {
   const mimeExtension =
        imageMimeType === "image/png" ? "png" :
        imageMimeType === "image/webp" ? "webp" :
        imageMimeType === "image/gif" ? "gif" :
        imageMimeType === "image/heic" ? "heic" :
        "jpg";
      const fileName = image.split("/").pop() || `photo-${Date.now()}.${mimeExtension}`;
      const extension = fileName.split(".").pop()?.toLowerCase();
      let mimeType = imageMimeType;
      if (!mimeType) {
        if (extension === "png") mimeType = "image/png";
        else if (extension === "jpg" || extension === "jpeg") mimeType = "image/jpeg";
        else if (extension === "heic") mimeType = "image/heic";
        else if (extension === "webp") mimeType = "image/webp";
        else if (extension === "gif") mimeType = "image/gif";
        else mimeType = "application/octet-stream";
      }

      const photoFormData = new FormData();
      photoFormData.append("photo", {
        uri: image,
        name: fileName,
        type: mimeType,
      } as any);
      photoFormData.append("is_primary", "true");

      const uploadResponse = await fetch(`${API_URL}/clothing/${createItemData.id}/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: photoFormData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json().catch(() => null);
        Alert.alert("Image upload failed", uploadError?.error || "Could not upload image.");
        return;
      }
}

export function AddClothingModal() {
    const navigation = useNavigation<ClosetScreenNavigationProp>();

  const [image, setImage] = useState<string | null>(null);
  const [clothingName, setClothingName] = useState<string | null>("")
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [clothingType, setClothingType] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageMimeType(result.assets[0].mimeType ?? null);
    }
  };

  async function addClothing() {
    //TODO: Blob the image so that it can be uploaded to server.
    if ((clothingName === "") || (clothingType === null) || (primaryColor === null) || (image === null)) {
      Alert.alert("Please fill in all fields.")
      return;
    }

    try {
      const token = await getItem("token");
      if (!token) {
        Alert.alert("You must be logged in to upload clothing.");
        return;
      }

      const createItemResponse = await fetch(`${API_URL}/clothing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: clothingName,
          category: clothingType,
          color_primary: primaryColor,
        })
      });

      const createItemData = await createItemResponse.json();
      if (!createItemResponse.ok || !createItemData?.id) {
        Alert.alert("Failed to create item before uploading image.");
        console.log(createItemResponse)
        return;
      }
      await uploadImage(image, imageMimeType, token, createItemData);
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to server.");
      console.error(err);
    }
    navigation.pop();

  };

    //TODO: Replace Text in Pressable with placeholder image that will show the clothing image once selected.
    //TODO: Add tags that can be selected once we discuss what tags should be put here.
    //TODO: Place picker into a different file that can be used by multiple screens.
    return(
        <View>
            <Text>Test</Text>
            <TextInput placeholder='Name of clothing' maxLength={28} onChangeText={setClothingName}/>

            <Pressable onPress={pickImage}>
                <Text>Press Here To Take Photo. TODO: REPLACE WITH PLACHOLDER IMAGE</Text> 
            </Pressable>
            {image && <Image source={{ uri: image }} style={imageStyle.image} />}

            <Picker selectedValue={clothingType} onValueChange={(itemValue) => setClothingType(itemValue)}>
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
            <Picker selectedValue={primaryColor} onValueChange={(itemValue) => setPrimaryColor(itemValue)}>
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

            <Button onPress={addClothing}>Add Clothing</Button>
        </View>
    )
}


const imageStyle = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});