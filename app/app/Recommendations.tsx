import { ScrollView, Text, View, Image, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';  // Imports tools for latitude longitude
import { fetchWithTimeout } from './utils';

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
                    <FontAwesome5 style={recommendationStyle.likeButtons} name="thumbs-up" size={20} color="#111" />
                </Pressable>
                <Pressable onPress={onDislike}>
                    <FontAwesome5 style={recommendationStyle.likeButtons} name="thumbs-down" size={20} color="#111" />
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

function getSimpleWeatherCondition( condition: string, isDaytime: boolean) {
    const normalizedCondition = condition.toLowerCase();
        let iconName: keyof typeof FontAwesome5.glyphMap = isDaytime ? "sun" : "moon";

        if (normalizedCondition.includes("thunder") || normalizedCondition.includes("storm")) {
            iconName = "bolt";
        } else if (normalizedCondition.includes("rain") || normalizedCondition.includes("drizzle")) {
            iconName = "cloud-rain";
        } else if (normalizedCondition.includes("snow") || normalizedCondition.includes("sleet")) {
            iconName = "snowflake";
        } else if (normalizedCondition.includes("cloud") || normalizedCondition.includes("overcast")) {
            iconName = "cloud";
        } else if (
            normalizedCondition.includes("fog") ||
            normalizedCondition.includes("mist") ||
            normalizedCondition.includes("haze") ||
            normalizedCondition.includes("smoke")
        ) {
            iconName = "smog";
        } else if (normalizedCondition.includes("wind")) {
            iconName = "wind";
        }
        return iconName;
}

function GetWeatherIcon({ condition, isDaytime }: {condition: string, isDaytime: boolean}) {
    const iconName = getSimpleWeatherCondition(condition, isDaytime);

    return (
        <View>
            <FontAwesome5 name={iconName} size={24} color="#111" />
        </View>
    );
}

export function RecommendationScreen() {

        const [weather, setWeather] = useState<WeatherData | null>(null);  //Function to set weather, starts empty
        const [loading, setLoading] = useState(true); //Function to see if weather data is still loading
        const [error, setError] = useState('');
        const [recommendations, setRecommendations] = useState<RecommendationProps | null>(null);


        useEffect(() => {
            async function fetchWeather() {
                try {
                    //Asks for permission before gather location data
                    const {status} = await Location.requestForegroundPermissionsAsync();

                    if (status !== 'granted') {
                        setError('Location permission was denied.');
                        return;
                    }

                    //Getting the device's location
                    const location = await Location.getCurrentPositionAsync();

                    const latitude = location.coords.latitude;
                    const longitude = location.coords.longitude;

                    console.log('Latitude:', latitude);
                    console.log('Longitude:', longitude);

                    //Logs the data that is fetched
                    console.log("Fetching weather from:", `${API_URL}/weather?lat=${latitude}&lon=${longitude}`);

                    //Gathers the actual data
                    const response = await fetchWithTimeout(`${API_URL}/weather`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({latitude, longitude})   
                    });
                    const data = await response.json();

                    //Logs weather data
                    console.log("Weather data:", data);

                    //Sets the received data
                    setWeather(data);

                //Catches errors while loading weather
                } catch (err) {
                    //Logs the error
                    console.error(err);
                    //Sets this as the error message
                    setError("Could not load weather.");
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
                <Text style={recommendationStyle.titleText}>Weather</Text>
                {loading && <Text>Loading weather...</Text>}
                {error !== '' && <Text>{error}</Text>}
                <View style={recommendationStyle.weatherViewContainer}>
                    {weather && (
                        <View style={recommendationStyle.horizontalView}>
                            <Text style={recommendationStyle.weatherText}>
                                {weather.city}: {weather.temperature}°F
                            </Text>
                            <GetWeatherIcon condition={weather.condition} isDaytime={weather.isDaytime}/>
                        </View>
                    )}
                </View>
                
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
        marginTop: 24,
        alignSelf: 'center',
    },
    subtitleText: {
        fontSize: 18,
    },

    likeButtons: {
        padding: 10,
    },
    weatherViewContainer: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
    },

    weatherText: {
        fontSize: 16,
        margin: 8,
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
        alignItems: "center",
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