import { ScrollView, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

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

            <View>
                <Recommendation Name="test" Tag="Tag Test"/>
            </View>
        </ScrollView>
    )
}
export default RecommendationScreen;