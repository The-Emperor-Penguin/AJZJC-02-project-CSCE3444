import { Text, View } from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

export function AddClothingModal() {
    const navigation = useNavigation<ClosetScreenNavigationProp>();

    function addClothing() {
        navigation.pop();
    }

    return(
        <View>
            <Text>Test</Text>
            <Button onPress={addClothing}>Add Clothing</Button>
        </View>
    )
}