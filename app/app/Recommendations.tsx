import { ScrollView, Text, View, Image, StyleSheet, Pressable, ImageBackground, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';  // Imports tools for latitude longitude
import * as Calendar from 'expo-calendar';  // Imports calendar tools from expo
import { fetchWithTimeout } from './utils';
import { getItem } from './AppStorage';
import { useThemeSettings, createThemeStyles } from './Theme';



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
    onWearOutfit?: () => void;
};

// This is where the weather data gets initialized
type WeatherData = {
    temperature: number;
    condition: string;
    city: string;
    isDaytime: boolean;
    windSpeed: string;
};

// Initializing Calendar Events
type CalendarEventSummary = {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
}

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

function RecommendationContainer({RecommendationName, Clothes, Tags, onWearOutfit}: RecommendationProps) {
    const { darkMode, palette, setDarkMode, setPalette } = useThemeSettings();
    const dynamicStyles = createThemeStyles(darkMode, palette);
    return(
        <View style={[recommendationStyle.recommendationContainer, dynamicStyles.card]}>
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
            <Pressable onPress={onWearOutfit} style={recommendationStyle.wearButton}>
                <Text style={recommendationStyle.wearButtonText}>Wear This Outfit</Text>
            </Pressable>
        </View>
    )
}

export function getSimpleWeatherCondition( condition: string, isDaytime: boolean) {
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
        const [recommendedItemIds, setRecommendedItemIds] = useState<number[]>([]);
        const [calendarEvents, setCalendarEvents] = useState<CalendarEventSummary[]>([]);

        const { darkMode, palette } = useThemeSettings();
        const dynamicStyle = createThemeStyles(darkMode, palette);


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

                    // Asks for permission to calendar
                    const calendarPermission = await Calendar.requestCalendarPermissionsAsync();

                    // Executes if user gives acces to their calendar
                    if (calendarPermission.status === 'granted') {
                        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

                        const start = new Date();
                        start.setHours(0, 0, 0, 0);  // Sets time to midnight

                        const end = new Date();
                        end.setHours(23, 59, 59, 999); // 11:59 p.m.

                        // Gets info from the local calendar
                        const eventResults = await Promise.all(
                            calendars.map(async (calendar) => {
                                try {
                                    return await Calendar.getEventsAsync([calendar.id], start, end);
                                } catch {
                                    return [];
                                }
                            })
                        );

                        // Uses the eventResults to create today's event
                        const todayEvents = eventResults.flat().map((event) => ({
                            id: event.id,
                            title: event.title ?? "Untitled event",
                            startDate:
                                event.startDate instanceof Date
                                    ? event.startDate.toISOString()
                                    : String(event.startDate),
                            endDate:
                                event.endDate instanceof Date
                                ? event.endDate.toISOString()
                                : String(event.endDate),
                            location: event.location ?? undefined,
                        }));

                        setCalendarEvents(todayEvents);
                    }
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
        if (!weather) return;
        try {
            const token = await getItem("token");
            if (!token) return;

            const response = await fetchWithTimeout(`${API_URL}/outfits/recommend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    temperature: weather.temperature,
                    condition: weather.condition,
                }),
            });

            const data = await response.json();

            if (data.outfit && data.outfit.length > 0) {
                setRecommendedItemIds(data.outfit.map((item: any) => item.id));
                setRecommendations({
                    RecommendationName: "Today's Outfit",
                    Tags: data.tags || [],
                    Clothes: data.outfit.map((item: any) => ({
                        Name: item.name,
                        ImageURL: item.photo_url || '',
                    })),
                });
            } else {
                setRecommendations(null);
            }
        } catch (err) {
            console.error("Could not load recommendations", err);
        }
    }
    getRecommendation();
    
}, [weather]);

    return(
        <ScrollView style={dynamicStyle.container}>
            {/* Display for weather data */}
            <View style={[recommendationStyle.recommendationContainer, dynamicStyle.colorCard]}>
                <Text style={[recommendationStyle.titleText, dynamicStyle.text]}>Weather</Text>
                {loading && <Text style={dynamicStyle.text}>Loading weather...</Text>}
                {error !== '' && <Text style={dynamicStyle.text}>{error}</Text>}
                <View style={recommendationStyle.weatherViewContainer}>
                    {weather && (
                        <View style={recommendationStyle.horizontalView}>
                            <Text style={[recommendationStyle.weatherText, dynamicStyle.text]}>
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
                        onWearOutfit={async () => {
                        try {
                            const token = await getItem("token");
                            if (!token) return;
                            await fetchWithTimeout(`${API_URL}/outfits/history`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ item_ids: recommendedItemIds }),
                            });
                            Alert.alert("Outfit logged!", "This outfit has been saved to your history.");
                        } catch (err) {
                            Alert.alert("Error", "Could not log outfit.");
                        }
                    }}
                    />
                ) : (
                    <Text style={[recommendationStyle.titleText, dynamicStyle.text]}>No Recommendations yet!</Text>
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
        backgroundColor: "#2ceaff", 
        alignItems: "center",
        padding: 10,
        margin: 10,
        borderRadius: 20,
        shadowColor: '#000',
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
    },
    wearButton: {
        backgroundColor: '#111',
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    wearButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },

})

export default RecommendationScreen;