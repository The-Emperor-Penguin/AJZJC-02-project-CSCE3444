import { ScrollView, Text, View } from 'react-native';


type RecommendationProps = {
    Name: string
    Tag: string
}

function Recommendation({Name, Tag}: RecommendationProps) {


    return(
        <View>
            <Text>{Name}</Text>
            <Text>{Tag}</Text>
        </View>
    )
}

export function RecommendationScreen() {
    return(
        <ScrollView>
            <View>
                <Text>Todays Recommended Outfits</Text>
            </View>
            <View>
                <Recommendation Name="test" Tag="Tag Test"/>
            </View>
        </ScrollView>
    )
}