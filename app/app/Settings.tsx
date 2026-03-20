import { Button } from '@react-navigation/elements';
import { Text, View } from 'react-native';

type SettingProps = {
    onSignOut?: () => void | Promise<void>;
}

export function SettingsScreen({ onSignOut }: SettingProps) {
    return(
        <View>
            <View>
                <Button onPress={() => onSignOut?.()}>Sign Out</Button>
            </View>
        </View>
    )
}