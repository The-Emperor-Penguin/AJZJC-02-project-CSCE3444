import { Pressable, Image, Text, View, Alert, StyleSheet } from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './index';
import * as ImagePicker from 'expo-image-picker';

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

    function addClothing() {
        navigation.pop();
    }

  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library.
    // Manually request permissions for videos on iOS when `allowsEditing` is set to `false`
    // and `videoExportPreset` is `'Passthrough'` (the default), ideally before launching the picker
    // so the app users aren't surprised by a system dialog after picking a video.
    // See "Invoke permissions for videos" sub section for more details.
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

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };


    return(
        <View>
            <Text>Test</Text>
            <Pressable onPress={pickImage}>
                <Text>Press Here To Take Photo</Text>
            </Pressable>
            {image && <Image source={{ uri: image }} style={imageStyle.image} />}
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