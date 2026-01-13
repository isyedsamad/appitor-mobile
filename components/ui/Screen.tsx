import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Loading from "./Loading";

export function Screen({ children }: { children: React.ReactNode }) {
  const { theme, colors } = useTheme();
  const { loading } = useAuth();
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(colors.bg);
      NavigationBar.setButtonStyleAsync(
        theme === "dark" ? "light" : "dark"
      );
    }
  }, [colors.bg, theme]);

  return (
    <>
      <StatusBar style={theme == "light" ? "dark" : "light"} backgroundColor={colors.primarySoft} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loading && <Loading />}
            <View
              style={{
                flexGrow: 1,
                backgroundColor: colors.bg,
              }}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
