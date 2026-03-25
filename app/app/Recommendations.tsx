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

        const [weather, setWeather] = useState<WeatherData | null>(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');

        useEffect(() => {
            async function fetchWeather() {
                try {
                    console.log("Fetching weather from:", `${API_URL}/weather`);
                    const response = await fetch(`${API_URL}/weather`);
                    const data = await response.json();
                    console.log("Weather data:", data);
                    setWeather(data);
                } catch (err) {
                    console.error(err);
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