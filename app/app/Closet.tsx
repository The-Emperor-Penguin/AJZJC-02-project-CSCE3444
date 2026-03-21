import { Pressable, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import type { RootStackParamList } from './index';

type ClosetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main View'>;

export function ClosetScreen() {
    const navigation = useNavigation<ClosetScreenNavigationProp>();

    return(
        <View>
            <View>
                <Text>TODO: Add tags and photo selection</Text>
            </View>
            <View>
                <Button onPress={() => navigation.navigate('Add Clothing')}>Add Clothing</Button>
            </View>
        </View>
    )
}

export function TakePhotoScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission}>grant permission</Button>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
<   View style={styleCamera.container}>
      <CameraView style={styleCamera.camera} facing={facing} />
      <View style={styleCamera.buttonContainer}>
        <TouchableOpacity style={styleCamera.button} onPress={toggleCameraFacing}>
          <Text style={styleCamera.text}>Flip Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function AddClothingModal() {
    const navigation = useNavigation<ClosetScreenNavigationProp>();

    function addClothing() {
        navigation.pop();
    }

    return(
        <View>
            <Text>Test</Text>
            <Pressable onPress={() => navigation.navigate("Take Photo")}>
                <Text>Press Here To Take Photo</Text>
            </Pressable>
            <Button onPress={addClothing}>Add Clothing</Button>
        </View>
    )
}


const styleCamera = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
