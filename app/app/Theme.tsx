import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { saveInsecureItem, getInsecureItem } from "./AppStorage";
import { Background } from "@react-navigation/elements";

type ThemeSettingsContextValue = {
  darkMode: boolean;
  palette: string;
  setDarkMode: (value: boolean) => void;
  setPalette: (value: string) => void;
};

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | undefined>(undefined);

const paletteColors: Record<string, string> = {
  "blue": "#38bdf8",
  "yellow": "#facc15",
  "green": "#10b981",
};

export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext);

  if (!context) {
    throw new Error("useThemeSettings must be used within ThemeSettingsProvider");
  }

  return context;
}

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemColorScheme === 'dark');
  const [palette, setPalette] = useState("blue");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStoredSettings() {
      const darkModeSave = await getInsecureItem("darkmode");
      const paletteSave = await getInsecureItem("palette");

      if (!isMounted) {
        return;
      }

      if (darkModeSave !== null) {
        setDarkMode(darkModeSave === "true");
      }

      if (paletteSave !== null) {
        setPalette(paletteSave);
      }

      setIsHydrated(true);
    }

    loadStoredSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void saveInsecureItem("darkmode", darkMode ? "true" : "false");
  }, [darkMode, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void saveInsecureItem("palette", palette);
  }, [palette, isHydrated]);

  return (
    <ThemeSettingsContext.Provider
      value={{
        darkMode,
        palette,
        setDarkMode,
        setPalette,
      }}
    >
      {children}
    </ThemeSettingsContext.Provider>
  );
}

export function createThemeStyles(darkMode: boolean, palette: string) {
      const dynamicStyles = {
        container: {
          backgroundColor: darkMode ? "#0f172a" : "#ffffff"
        },
        text: {
          color: darkMode ? "#ffffff" : "#000000"
        },
        picker: {
          backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
          color: darkMode ? "#ffffff" : "#000000",  
        },
        card: {
          backgroundColor: darkMode ? "#1e293b" : "#f1f5f9"
        },
        colorCard: {
          backgroundColor: paletteColors[palette],  
        },
        dirtyClothes: {
          backgroundColor: darkMode ? '#202020' : '#8f8f8f',
        },
        cleanClothes: {
          backgroundColor: darkMode ? '#343333' : '#cacaca',
        },
        pressables: {
          backgroundColor: darkMode ? "#334155": "#dedddd"
        },
        selectedPressable: {
          backgroundColor: paletteColors[palette],
        },
        selectedColor: {
          borderColor: darkMode ? "#ffffff" : "#000000"
        },
        notSelectedColor: {
          borderColor: darkMode ? "#000000" : "#ffffff" 
        }};
        return dynamicStyles
}