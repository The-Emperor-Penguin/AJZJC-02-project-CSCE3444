import { ScrollView, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';  // Imports tools for latitude longitude

// constant for the API url
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type RecommendationProps = {
    Name: string
    Tag: string
}

// This is where the weather data gets initialized
type WeatherData = {
    temperature: number;
    condition: string;
    city: string;
    isDaytime: boolean;
    windSpeed: string;
};

function Recommendation({Name, Tag}: RecommendationProps) {


    return(
        <View>
            <Text>{Name}</Text>
            <Text>{Tag}</Text>
        </View>
    )
}

export function RecommendationScreen() {

        const [weather, setWeather] = useState<WeatherData | null>(null);  //Function to set weather, starts empty
        const [loading, setLoading] = useState(true); //Function to see if weather data is still loading
        const [error, setError] = useState('');

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
                    const response = await fetch(`${API_URL}/weather?lat=${latitude}&lon=${longitude}`);
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

    return(
        <ScrollView>
            <View>
                <Text>Today's Recommended Outfits</Text>
            </View>

            {/* Display for weather data */}
            <View>
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
        </ScrollView>
    )
}
export default RecommendationScreen;