import { useState, useEffect } from 'react';
import { Pressable, Image, Text, View, Alert, StyleSheet, TextInput, ScrollView, Switch } from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './index';
import { getItem } from './AppStorage';
import { fetchWithTimeout, PickerTags, userPickImage, pickerToTag } from './utils';
import { useThemeSettings, createThemeStyles } from './Theme';
import { FontAwesome5 } from '@expo/vector-icons';

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
      <Text style={closetStyle.clothingName}>{name}</Text>
      <Text style={closetStyle.clothingText}>{category}</Text>
      {image && <Image source={{uri: image}} style={closetStyle.imageElevated}/>}
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
      method: "DELETE",
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

export function ClothingItemScreen(item: ClothingItem) {
  const navigation = useNavigation<ClosetScreenNavigationProp>();
  const [currentItem, setCurrentItem] = useState<ClothingItem>(item);
  const imageUrl = API_URL + '/' + currentItem.primary_photo_uri;

  useFocusEffect(() => {
    const fetchItem = async () => {
      try {
        const token = await getItem("token");
        if (!token) return;
        
        const response = await fetchWithTimeout(`${API_URL}/clothing`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        });
        
        const data = await response.json();
        const updatedItem = data.items.find((i: ClothingItem) => i.id === item.id);
        if (updatedItem) {
          setCurrentItem(updatedItem);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchItem();
  });

  return(
    <View>
      {currentItem.primary_photo_uri && <Image source={{uri: imageUrl}} style={closetStyle.image}/>}
      <Text style={closetStyle.clothingName}>{currentItem.name}</Text>
      <Text style={closetStyle.clothingText}>{pickerToTag(currentItem.category)}</Text>
      <Text style={closetStyle.clothingText}>{pickerToTag(currentItem.color_primary)}</Text>
      <Text style={closetStyle.clothingText}>Status: {currentItem.status}</Text>
      <Button style={closetStyle.buttons} onPress={async () => {
        const token = await getItem("token");
        if (!token) return;
        const response = await fetchWithTimeout(`${API_URL}/clothing/${currentItem.id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setCurrentItem({ ...currentItem, status: data.status });
        }
      }}>
        {currentItem.status === "clean" ? "Mark as Dirty" : "Mark as Clean"}
      </Button>
      <Button style={closetStyle.buttons} onPress={() =>deleteClothingItem(currentItem.id, navigation)}>Delete Clothing</Button>
      <Button style={closetStyle.buttons} onPress={() => navigation.navigate("Edit Clothing Screen", { item: currentItem })}>Edit Clothing</Button>
    </View>
)
}

export function EditClothingScreen({id, name, category, color_primary, primary_photo_uri,}: ClothingItem) {
  const navigation = useNavigation<ClosetScreenNavigationProp>();
  const [image, setImage] = useState<string | null>(API_URL + '/' + primary_photo_uri);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [clothingName, setClothingName] = useState<string | null>(name)
  const [clothingType, setClothingType] = useState<string | null>(category);
  const [primaryColor, setPrimaryColor] = useState<string | null>(color_primary);
  
  async function editClothing(id: number, image: string | null, clothingName: string | null, clothingType: string | null, primaryColor: string | null) {
    const token = await getItem("token");

    if (!token) {
      Alert.alert("Error", "You are not logged in!");
      return;
    }

    const formData = new FormData();
    formData.append("name", clothingName ?? "");
    formData.append("category", clothingType ?? "");
    formData.append("color_primary", primaryColor ?? "");

    if (image && !image.startsWith(API_URL ?? "http")) {
      formData.append("photo", {
        uri: image,
        name: `photo-${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/clothing/${id}/edit`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        Alert.alert("Error", error?.error || "Failed to update clothing");
        return;
      }

      Alert.alert("Success", "Clothing updated successfully");
      setTimeout(() => {
        navigation.pop();
      }, 500);
    } catch (err) {
      Alert.alert("Error", "Network error while updating clothing");
      console.error(err);
    }
  }

  return (
    <View>
      <Pressable onPress={() => userPickImage(setImage, setImageMimeType)}>
        {image && <Image source={{ uri: image }} style={closetStyle.imageElevated} />}
      </Pressable>
      <TextInput style={closetStyle.input} onChangeText={setClothingName}>{clothingName}</TextInput>
      <PickerTags 
        clothingType={clothingType} 
        setClothingType={setClothingType} 
        primaryColor={primaryColor}
        setPrimaryColor={setPrimaryColor}
      />
      <Button style={closetStyle.buttons} onPress={() => editClothing(id, image, clothingName, clothingType, primaryColor)} >Confirm Changes</Button>
    </View>
  )
}

export function ClosetScreen() {
  const [listItems, setListItems] = useState<ClothingItem[]>([]);
  const navigation = useNavigation<ClosetScreenNavigationProp>();

  const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();
  const dynamicStyles = createThemeStyles(darkMode, palette);

  //Refreshes the list of items every time the screen is opened.
  useFocusEffect(() => {
      getClothingItems().then(items => setListItems(items || []));
  });
  //Note the root view is scrolling so that you can see all of the elements.
  //Otherwise things could be cut off.

  return(
    <ScrollView style={dynamicStyles.container}>
      <View>
        {listItems.length === 0 ? (
          <Text style={[closetStyle.clothingText, dynamicStyles.text]}>No clothing items yet. Add clothing to get started!</Text>
        ) : (
        listItems.map((item) => (
          <Pressable 
            key={item.id} 
            style={item.status === "dirty" ? closetStyle.dirtyClothes : closetStyle.cleanClothes}
            onPress={() => navigation.navigate("Clothing Item Screen", { item })}
          >
            <ClothingComponent
              name={item.name}
              color={pickerToTag(item.color_primary)}
              category={pickerToTag(item.category)}
              image={item.primary_photo_uri}
            />
          </Pressable>
          ))
          )}
      </View>
      <View>
        <Button style={[closetStyle.buttons, dynamicStyles.pressables]} onPress={() => navigation.navigate('Add Clothing')}>Add Clothing</Button>
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
            <TextInput style={closetStyle.input} placeholder='Name of clothing' maxLength={28} onChangeText={setClothingName}/>

            <Pressable onPress={() => userPickImage(setImage, setImageMimeType)}>
              {image && <Image source={{ uri: image }} style={closetStyle.imageElevated} />}
              { !image && (
                <View style={closetStyle.imagePlaceholder}>
                  <FontAwesome5 name="camera" size={64} color='#111'/> 
                </View>
                )
              }
            </Pressable>
            <PickerTags 
              clothingType={clothingType} 
              setClothingType={setClothingType} 
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
            />
            <Button style={closetStyle.buttons} onPress={addClothing}>Add Clothing</Button>
        </View>
    )
}

//TODO:change stylesheet to look more professional
//Style for images
const closetStyle = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignSelf: 'center',
    backgroundColor: "#b3b3b3", //Need to change when using dark mode
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // TODO: Change to white when in dark mode
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8, 
    shadowRadius: 2,
    elevation: 5, 
  },
  imageElevated: {
    width: 200,
    height: 200,
    margin: 12,
    borderRadius: 16,
    alignSelf: 'center',
    shadowColor: '#000', // TODO: Change to white when in dark mode
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8, 
    shadowRadius: 2,
    elevation: 5, 
  },
  image: {
    width: 200,
    height: 200,
    margin: 12,
    borderRadius: 16,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 8,
    padding: 10,
    marginTop: 24,
    marginLeft: 12,
    marginRight: 12,
    marginBottom: 24,
    color: '#000000',
  },
    clothingName: {
    color: '#000000',
    alignSelf: 'center',
    fontSize: 18,
    padding: 3,
  },
  clothingText: {
    color: '#000000',
    alignSelf: 'center',
    fontSize: 16,
    padding: 3,
  },
  dirtyClothes: {
    backgroundColor: '#8f8f8f',
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000', // TODO: Change to white when in dark mode
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8, 
    shadowRadius: 2,
    elevation: 5, 

  },
  cleanClothes: {
    backgroundColor: '#cacaca',
    marginTop: 24,
    marginLeft: 12,
    marginRight: 12,
    borderRadius: 8,
    shadowColor: '#000', // TODO: Change to white when in dark mode
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8, 
    shadowRadius: 2,
    elevation: 5, 
  },
  buttons: {
    marginTop: 24,
    marginLeft: 12,
    marginRight: 12,
  }
});