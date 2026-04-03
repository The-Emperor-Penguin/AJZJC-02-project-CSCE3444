import { ScrollView, Text, View, Image, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

// constant for the API url
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type RecommendationClothes = {
    Name: string;
    ImageURL: string;
}

type RecommendationProps = {
    Tags: string[];
    RecommendationName: string;
    Clothes: RecommendationClothes[];
};

// This is where the weather data gets initialized
type WeatherData = {
    temperature: number;
    condition: string;
    city: string;
    isDaytime: boolean;
    windSpeed: string;
};

//TODO: Replace onLike and onDislike with real recommendation code

async function onLike() {
    console.log("Pressed Like")
}

async function onDislike() {
    console.log("Pressed Dislike")
}

function ImageWithCaption({Name, ImageURL}: RecommendationClothes) {
    return(
        <ImageBackground source={{uri: ImageURL}} style={recommendationStyle.image} 
            imageStyle={recommendationStyle.imageRadius}
        >
            <Text style={recommendationStyle.imageText}>{Name}</Text>
        </ImageBackground>
    )
}

function RecommendationContainer({RecommendationName, Clothes, Tags}: RecommendationProps) {
    return(
        <View style={recommendationStyle.recommendationContainer}>
            <View style={recommendationStyle.mainHorizontalView}>
                <Text style={recommendationStyle.subtitleText}>{RecommendationName}</Text>
                <Pressable onPress={onLike}>
                    <FontAwesome style={recommendationStyle.likeButtons} name="thumbs-up" size={20} color="#111" />
                </Pressable>
                <Pressable onPress={onDislike}>
                    <FontAwesome style={recommendationStyle.likeButtons} name="thumbs-down" size={20} color="#111" />
                </Pressable>
            </View>
            <Text>Tags:</Text>
            <View style={recommendationStyle.horizontalView}>
                { Tags.map((tag) => (
                        <Text style={recommendationStyle.Tags} key={tag}>
                            {tag}
                        </Text>
                    ))
                }
            </View>
            <View style={recommendationStyle.horizontalView}>
                {Clothes.map((clothing) => (
                    <ImageWithCaption
                        Name={clothing.Name}
                        ImageURL={clothing.ImageURL}
                        key={clothing.Name}
                    />
                ))}
            </View>
        </View>
    )
}

export function RecommendationScreen() {

        const [weather, setWeather] = useState<WeatherData | null>(null);  //Function to set weather, starts empty
        const [loading, setLoading] = useState(true); //Function to see if weather data is still loading
        const [error, setError] = useState('');
        const [recommendations, setRecommendations] = useState<RecommendationProps | null>(null);


        useEffect(() => {
            async function fetchWeather() {
                try {
                    console.log("Fetching weather from:", `${API_URL}/weather`); //Logs data as weather is being processed
                    const response = await fetch(`${API_URL}/weather`);
                    const data = await response.json();
                    console.log("Weather data:", data);
                    setWeather(data);  //Sets the received data
                } catch (err) {     //Catches errors while loading weather
                    console.error(err);
                    setError("Could not load weather.");  //Sets this as the error message
                } finally {
                    setLoading(false);
                }
            }

            fetchWeather();
        }, []);

        useEffect(() => {
            async function getRecommendation() {
                var rec: RecommendationProps = {
                    RecommendationName: "Test Recommendation Preview",
                    Tags: ["Red", "Shorts", "Warm"],
                    Clothes: [{
                        Name: "Clothes 1",
                        ImageURL: "https://www.globalpenguinsociety.org/images/species/norrock/nor-05.webp",
                    }],
                };
                // Can change null to rec to see example
                setRecommendations(rec);
            }
            getRecommendation();
        }, []);

    return(
        <ScrollView>
            <View>
                <Text style={recommendationStyle.titleText}>Today's Recommended Outfits</Text>
            </View>

            {/* Display for weather data */}
            {/*TODO: Add a weather icon as well */}
            <View style={recommendationStyle.recommendationContainer}>
                {loading && <Text>Loading weather...</Text>}
                {error !== '' && <Text>{error}</Text>}
                {weather && (
                    <Text>
                        {weather.city}: {weather.temperature}°F, {weather.condition}
                        {"\n"}Daytime: {weather.isDaytime ? "Day" : "Night"}
                        {"\n"}Wind Speed: {weather.windSpeed}
                    </Text>
                )}
            </View>

            <View>
                {recommendations ? (
                    <RecommendationContainer
                        Tags={recommendations.Tags}
                        RecommendationName={recommendations.RecommendationName}
                        Clothes={recommendations.Clothes}
                    />
                ) : (
                    <Text>No Recommendations yet!</Text>
                )}
            </View>
        </ScrollView>
    )
}

const recommendationStyle = StyleSheet.create({
    titleText: {
        fontSize: 22,
    },
    subtitleText: {
        fontSize: 18,
    },

    likeButtons: {
        padding: 10,
    },

    mainHorizontalView: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
    },
    horizontalView: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    recommendationContainer: {
        backgroundColor: "#2ceaff", //TODO: Change based of user prefrence from settings page
        alignItems: "center",
        padding: 10,
        margin: 10,
        borderRadius: 20,
        shadowColor: '#000', // TODO: Change to white when in dark mode
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.8, 
        shadowRadius: 2,
        elevation: 5, 
    },
    Tags: {
        backgroundColor: "#2ca0ff",
        margin: 8,
        padding: 8,
        borderRadius: 15,
        alignSelf: "center",
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: .8,
        shadowRadius: 2,
        elevation: 5,
    },
    image: {
        width: 200,
        height: 200,
    },
    imageRadius: {
        borderRadius: 16,
    },
    imageText: {
        color: "#FFF",
        alignSelf: "flex-end",
        marginTop: "auto",
        paddingRight: 10,
        paddingBottom: 5,
    }

})

export default RecommendationScreen;