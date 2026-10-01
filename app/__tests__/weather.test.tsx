import { test, expect, describe } from '@jest/globals';
import { getSimpleWeatherCondition } from '@/app/Recommendations';

describe('White-Box: getSimpleWeatherCondition Branch & Decision Coverage', () => {
    // Decision 0: isDaytime fallback when no conditions match
    test('Default icon: isDaytime=true and clear weather returns "sun"', () => {
        expect(getSimpleWeatherCondition('Clear', true)).toBe('sun');
    });

    test('Default icon: isDaytime=false and clear weather returns "moon"', () => {
        expect(getSimpleWeatherCondition('Clear', false)).toBe('moon');
    });

    // Decision 1: normalizedCondition.includes("thunder") || normalizedCondition.includes("storm")
    test('Condition 1a: includes "thunder" -> "bolt"', () => {
        expect(getSimpleWeatherCondition('Isolated Thunder', true)).toBe('bolt');
        expect(getSimpleWeatherCondition('Thunderstorms', false)).toBe('bolt');
    });

    test('Condition 1b: includes "storm" without thunder -> "bolt"', () => {
        expect(getSimpleWeatherCondition('Severe Dust Storm', true)).toBe('bolt');
    });

    // Decision 2: normalizedCondition.includes("rain") || normalizedCondition.includes("drizzle")
    test('Condition 2a: includes "rain" -> "cloud-rain"', () => {
        expect(getSimpleWeatherCondition('Light Rain', true)).toBe('cloud-rain');
    });

    test('Condition 2b: includes "drizzle" -> "cloud-rain"', () => {
        expect(getSimpleWeatherCondition('Patchy Drizzle', false)).toBe('cloud-rain');
    });

    // Decision 3: normalizedCondition.includes("snow") || normalizedCondition.includes("sleet")
    test('Condition 3a: includes "snow" -> "snowflake"', () => {
        expect(getSimpleWeatherCondition('Heavy Snow', true)).toBe('snowflake');
    });

    test('Condition 3b: includes "sleet" -> "snowflake"', () => {
        expect(getSimpleWeatherCondition('Freezing Sleet', false)).toBe('snowflake');
    });

    // Decision 4: normalizedCondition.includes("cloud") || normalizedCondition.includes("overcast")
    test('Condition 4a: includes "cloud" -> "cloud"', () => {
        expect(getSimpleWeatherCondition('Partly Cloudy', true)).toBe('cloud');
    });

    test('Condition 4b: includes "overcast" -> "cloud"', () => {
        expect(getSimpleWeatherCondition('Overcast Skies', false)).toBe('cloud');
    });

    // Decision 5: includes "fog" || includes "mist" || includes "haze" || includes "smoke"
    test('Condition 5a: includes "fog" -> "smog"', () => {
        expect(getSimpleWeatherCondition('Dense Fog', true)).toBe('smog');
    });

    test('Condition 5b: includes "mist" -> "smog"', () => {
        expect(getSimpleWeatherCondition('Morning Mist', false)).toBe('smog');
    });

    test('Condition 5c: includes "haze" -> "smog"', () => {
        expect(getSimpleWeatherCondition('Afternoon Haze', true)).toBe('smog');
    });

    test('Condition 5d: includes "smoke" -> "smog"', () => {
        expect(getSimpleWeatherCondition('Wildfire Smoke', false)).toBe('smog');
    });

    // Decision 6: includes "wind"
    test('Condition 6: includes "wind" -> "wind"', () => {
        expect(getSimpleWeatherCondition('Breezy and Windy', true)).toBe('wind');
    });

    // Case insensitivity normalization test
    test('Case insensitivity: upper and mixed case conditions correctly normalized', () => {
        expect(getSimpleWeatherCondition('THUNDERSTORM', true)).toBe('bolt');
        expect(getSimpleWeatherCondition('RAIN AND WIND', true)).toBe('cloud-rain'); // matches rain first
        expect(getSimpleWeatherCondition('WINDY', true)).toBe('wind');
    });
});

