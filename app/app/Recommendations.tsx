import { ScrollView, Text, View, Image, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

// constant for the API url
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type RecommendationProps = {
    Name: string;
    ImageURL: string;
    Tags: string[];
};

// This is where the weather data gets initialized
type WeatherData = {
    temperature: number;
    condition: string;
    city: string;
    isDaytime: boolean;
    windSpeed: string;
};



function RecommendationContainer({Name, Tags, ImageURL}: RecommendationProps) {
    return(
        <View style={recommendationStyle.recommendationContainer}>
            <Text>{Name}</Text>
            <View style={recommendationStyle.horizontalView}>
                {Tags.map((tag) => <Text>{tag}</Text>)}
            </View>
            {ImageURL && <Image source={{uri: ImageURL}} style={recommendationStyle.image}/>}
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
                setRecommendations(null);
            }
            getRecommendation();
        }, []);

    //TODO: Create a useEffect that gets user recommendation from server

    return(
        <ScrollView>
            <View>
                <Text>Today's Recommended Outfits</Text>
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
                {recommendations ? (<RecommendationContainer Name={recommendations.Name} ImageURL={recommendations.ImageURL} Tags={recommendations.Tags} />) : (<Text>No Recommendations yet!</Text>)}
            </View>
        </ScrollView>
    )
}

const recommendationStyle = StyleSheet.create({
    horizontalView: {
        display: "contents",
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
    image: {
        width: 200,
        height: 200,
    },

})

export default RecommendationScreen;