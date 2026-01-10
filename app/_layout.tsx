import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from "@/context/ThemeContext";
import { toastConfig } from '@/lib/toastConfig';
import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from "react-native-toast-message";
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
          </Stack>
          <Toast config={toastConfig} />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
