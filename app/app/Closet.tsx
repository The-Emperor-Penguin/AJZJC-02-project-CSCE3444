import { useState } from 'react';
import { Pressable, Image, Text, View, Alert, StyleSheet, TextInput } from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker'
import * as ImagePicker from 'expo-image-picker';
import type { RootStackParamList } from './index';

const API_URL=process.env.EXPO_PUBLIC_API_URL;

type ClosetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main View'>;

export function ClosetScreen() {
    const navigation = useNavigation<ClosetScreenNavigationProp>();

    return(
        <View>
            <View>
                <Text>TODO: Add tags and photos from closet</Text>
            </View>
            <View>
                <Button onPress={() => navigation.navigate('Add Clothing')}>Add Clothing</Button>
            </View>
        </View>
    )
}

export function AddClothingModal() {
    const navigation = useNavigation<ClosetScreenNavigationProp>();

  const [image, setImage] = useState<string | null>(null);
  const [clothingName, setClothingName] = useState<string | null>("")
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
    }
  };

  function addClothing() {
    //TODO: Blob the image so that it can be uploaded to server.
    if ((clothingName === "") || (clothingType === null) || (primaryColor === null) || (image === null)) {
      Alert.alert("Please fill in all fields.")
    }

    const response = fetch(`${API_URL}/clothing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },  // tells the server were sending JSON
      body: JSON.stringify({
        name: clothingName,
        clothingType,
        primaryColor,
        image,
      }) //converts the data to JSON format

    });



  };

    //TODO: Replace Text in Pressable with placeholder image that will show the clothing image once selected.
    //TODO: Add tags that can be selected once we discuss what tags should be put here.

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