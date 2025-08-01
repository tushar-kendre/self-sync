import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DatabaseManager } from "./database";
import { AppSettingsService } from "./database/services/app-settings";

const THEME_STORAGE_KEY = "@selfSync_theme_preference";

export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } =
    useNativewindColorScheme();

  // Load theme preference from AsyncStorage on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const getAppSettingsService = () => {
    try {
      const manager = DatabaseManager.getInstance();
      return new AppSettingsService(manager.getDatabase());
    } catch (error) {
      console.warn(
        "Database not available for theme settings, using AsyncStorage only",
      );
      return null;
    }
  };

  const loadThemePreference = async () => {
    try {
      // Try AsyncStorage first (faster)
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        console.log(
          "Loading saved theme preference from AsyncStorage:",
          savedTheme,
        );
        setColorScheme(savedTheme);
        return;
      }

      // Fallback to database if AsyncStorage doesn't have it
      const appSettings = getAppSettingsService();
      if (appSettings) {
        const dbTheme = await appSettings.getThemePreference();
        if (dbTheme) {
          console.log("Loading saved theme preference from database:", dbTheme);
          setColorScheme(dbTheme);
          // Also save to AsyncStorage for faster access next time
          await AsyncStorage.setItem(THEME_STORAGE_KEY, dbTheme);
          return;
        }
      }

      console.log("No saved theme preference found, using system default");
    } catch (error) {
      console.error("Failed to load theme preference:", error);
    }
  };

  const saveThemePreference = async (theme: "light" | "dark") => {
    try {
      // Save to AsyncStorage for fast access
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      console.log("Theme preference saved to AsyncStorage:", theme);

      // Also save to database for persistence across app uninstalls
      const appSettings = getAppSettingsService();
      if (appSettings) {
        await appSettings.setThemePreference(theme);
        console.log("Theme preference saved to database:", theme);
      }
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  const setColorSchemeWithPersistence = (theme: "light" | "dark") => {
    setColorScheme(theme);
    saveThemePreference(theme);
  };

  const toggleColorSchemeWithPersistence = () => {
    const newTheme = colorScheme === "dark" ? "light" : "dark";
    setColorSchemeWithPersistence(newTheme);
  };

  return {
    colorScheme: colorScheme ?? "dark",
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme: setColorSchemeWithPersistence,
    toggleColorScheme: toggleColorSchemeWithPersistence,
  };
}
