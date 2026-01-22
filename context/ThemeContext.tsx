import { AppTheme, darkTheme, lightTheme } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextType = {
  themeMode: ThemeMode;
  theme: 'light' | 'dark';
  colors: AppTheme;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = 'app_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setThemeMode(value);
      }
    });
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

  const colors = useMemo(
    () => (resolvedTheme === 'dark' ? darkTheme : lightTheme),
    [resolvedTheme]
  );

  const updateThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        theme: resolvedTheme,
        colors,
        setThemeMode: updateThemeMode,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}

// import React, { createContext, useContext, useMemo } from "react";
// import { useColorScheme } from "react-native";
// import { lightTheme, darkTheme, AppTheme } from "@/lib/theme";

// type ThemeContextType = {
//   theme: "light" | "dark";
//   colors: AppTheme;
// };

// const ThemeContext = createContext<ThemeContextType | null>(null);

// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   const scheme = useColorScheme();
//   const theme = scheme === "dark" ? "dark" : "light";

//   const colors = useMemo(
//     () => (theme === "dark" ? darkTheme : lightTheme),
//     [theme]
//   );

//   return (
//     <ThemeContext.Provider value={{ theme, colors }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

// export function useTheme() {
//   const ctx = useContext(ThemeContext);
//   if (!ctx) {
//     throw new Error("useTheme must be used inside ThemeProvider");
//   }
//   return ctx;
// }
