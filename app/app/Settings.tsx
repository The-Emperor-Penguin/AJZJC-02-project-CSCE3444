import { Button } from '@react-navigation/elements';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './index';

type SettingProps = {
    onSignOut?: () => void | Promise<void>;
}

export function SettingsScreen({ onSignOut }: SettingProps) {
    // Get navigation so we can navigate to the Edit Profile modal
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return(
        <View>
            <View>
                {/* Navigate to the Edit Profile modal */}
                <Button onPress={() => navigation.navigate('Edit Profile')}>Edit Profile</Button>
                <Button onPress={() => navigation.navigate('Change Password')}>Change Password</Button>
                <Button onPress={() => onSignOut?.()}>Sign Out</Button>
            </View>
        </View>
    )
}