import { useState, useEffect } from 'react';
import { Pressable, Image, Text, View, Alert, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker'
import * as ImagePicker from 'expo-image-picker';
import type { RootStackParamList } from './index';
import { getItem } from './SecureStore';
import { fetchWithTimeout } from './utils';

const API_URL=process.env.EXPO_PUBLIC_API_URL;

type ClosetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main View'>;

interface ClothingComponentProps {
  name: string;
  color: string;
  category: string;
  image: string;
}

export interface ClothingItem {
  id: number;
  user_id: number;
  name: string;
  category: string;
  color_primary: string;
  primary_photo_uri: string;
  subcategory?: string;
  layer_role?: string;
  color_secondary?: string;
  pattern?: string;
  material?: string;
  formality_level?: number;
  warmth_score?: number;
  status?: string;
  favorite?: number;
}

function ClothingComponent({name, color, category, image }: ClothingComponentProps) {
  image = API_URL + '/' + image
  return(
    <View>
      <Text>{name} - {color} - {category}</Text>
      {image && <Image source={{uri: image}} style={imageStyle.image}/>}
    </View>
  )
}

async function getClothingItems() {
  try {
    const token = await getItem("token");
    if (!token) {
      Alert.alert("You must be logged in to upload clothing.");
      return [];
    }
    const itemsResponse = await fetchWithTimeout(`${API_URL}/clothing`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }});
    const items = await itemsResponse.json();
    return items.items;
  } catch (err) {
    Alert.alert("Error getting clothing");
    console.error(err);
    return [];
  }  
};

async function deleteClothingItem(id: number, navigation: ClosetScreenNavigationProp) {
  try{
    const token = await getItem("token");
    if (!token) {
      Alert.alert("You must be logged in to delete clothing.");
      return false;
    }
    const deleteResponse = await fetchWithTimeout(`${API_URL}/clothing/${id}/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });
    if (!deleteResponse.ok) {
      Alert.alert("Could not delete clothes");
    } else {
      Alert.alert("Deleted clothing");
      navigation.pop();
    }
  } catch (err) {
    Alert.alert("Could not delete clothes");
    console.error(err);
    return false;
  }
}

export function ClothingItemScreen({id, name, category, color_primary, primary_photo_uri,}: ClothingItem) {
  const navigation = useNavigation<ClosetScreenNavigationProp>();
  return(
      <View>
        {primary_photo_uri && <Image source={{uri: primary_photo_uri}} style={imageStyle.image}/>}
        <Text>{name}</Text>
        <Text>{category}</Text>
        <Text>{color_primary}</Text>
        <Button onPress={() =>deleteClothingItem(id, navigation)}>Delete Clothing</Button>
        <Button>Edit Clothing</Button>
      </View>
  )
}

export function ClosetScreen() {
  const [listItems, setListItems] = useState<ClothingItem[]>([]);
  const navigation = useNavigation<ClosetScreenNavigationProp>();
  //Refreshes the list of items every time the screen is opened.
  useFocusEffect(() => {
      getClothingItems().then(items => setListItems(items || []));
  });
  //Note the root view is scrolling so that you can see all of the elements.
  //Otherwise things could be cut off.
  return(
    <ScrollView>
      <View>
        {listItems.length === 0 ? (
          <Text>No clothing items yet. Add clothing to get started!</Text>
        ) : (
        listItems.map((item) => (
          <Pressable key={item.id} onPress={() => navigation.navigate("Clothing Item Screen", { item })}>
            <ClothingComponent
              name={item.name}
              color={item.color_primary}
              category={item.category}
              image={item.primary_photo_uri}
            />
          </Pressable>
          ))
          )}
      </View>
      <View>
        <Button onPress={() => navigation.navigate('Add Clothing')}>Add Clothing</Button>
      </View>
    </ScrollView>
  )
}

async function uploadImage(image: string, imageMimeType: string | null, token: string, createItemData: { id: number }) {
  //Create lookup for extension and mime type
  const mimeTypeMap = [
    { mime: "image/png", extensions: ["png"] },
    { mime: "image/jpeg", extensions: ["jpg", "jpeg"] },
    { mime: "image/gif", extensions: ["gif"] },
    { mime: "image/heic", extensions: ["heic"] },
    { mime: "image/webp", extensions: ["webp"] },
  ] as const;

  //Build mimeToExtension map
  const mimeToExtension = Object.fromEntries(
    mimeTypeMap.map(({ mime, extensions }) => [mime, extensions[0]])
  );
  //Build extensionToMime map
  const extensionToMimeType = Object.fromEntries(
    mimeTypeMap.flatMap(({ mime, extensions }) => 
      extensions.map(ext => [ext, mime])
    )
  );
  //Get mime extension
  const mimeExtension = mimeToExtension[imageMimeType ?? ""] ?? "jpg";

  //Get file name and extension
  const fileName = image.split("/").pop() || `photo-${Date.now()}.${mimeExtension}`;
  const extension = fileName.split(".").pop()?.toLowerCase();

  //Get mime type
  const mimeType = imageMimeType ?? extensionToMimeType[extension ?? ""] ?? "application/octet-stream";

  //Create photoFormData to send to server
  const photoFormData = new FormData();
  photoFormData.append("photo", {
    uri: image,
    name: fileName,
    type: mimeType,
  } as any);

  //Set the upload as the primary photo
  photoFormData.append("is_primary", "true");
  //Post data to server
  const uploadResponse = await fetchWithTimeout(`${API_URL}/clothing/${createItemData.id}/photos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: photoFormData,
  });
  //Error handle if there is a bad response
  if (!uploadResponse.ok) {
    const uploadError = await uploadResponse.json().catch(() => null);
    Alert.alert("Image upload failed", uploadError?.error || "Could not upload image.");
    return;
  }
}

export function AddClothingModal() {
  //Get current navigation object
  const navigation = useNavigation<ClosetScreenNavigationProp>();
  //Declare variables and their states
  const [image, setImage] = useState<string | null>(null);
  const [clothingName, setClothingName] = useState<string | null>("")
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [clothingType, setClothingType] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  //Create image picker function
  const pickImage = async () => {
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
  };

  async function addClothing() {
    //If any tag is blank or null alert user to fill in all fields
    if ((clothingName === "") || (clothingType === null) || (primaryColor === null) || (image === null)) {
      Alert.alert("Please fill in all fields.")
      return;
    }
    //Try catch to prevent unhandled errors
    try {
      //Get user token and prompt user if not logged in
      const token = await getItem("token");
      if (!token) {
        //Should only happen if login state is not properly handled
        Alert.alert("You must be logged in to upload clothing.");
        return;
      }
      //Post to server new item to create
      const createItemResponse = await fetchWithTimeout(`${API_URL}/clothing`, {
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
      //Get response from server in json
      const createItemData = await createItemResponse.json();
      //Handle bad responses
      if (!createItemResponse.ok || !createItemData?.id) {
        Alert.alert("Failed to create item before uploading image.");
        console.log(createItemResponse)
        return;
      }
      //Upload image to server
      await uploadImage(image, imageMimeType, token, createItemData);
    } catch (err) {
      //General catch for any error in try
      Alert.alert("Network Error", "Could not connect to server.");
      //console.error() will show users the error. 
      console.error(err);
    }
    navigation.pop();

  };

    //TODO: Replace Text in Pressable with placeholder image that will show the clothing image once selected.
    //TODO: Add more tags that can be selected
    //TODO: Place picker into a different file that can be used by multiple screens.
    //Basic UI of the closet screen, Picker is a dropdown object
    return(
        <View>
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

//TODO:change stylesheet to look more professional
//Style for images
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