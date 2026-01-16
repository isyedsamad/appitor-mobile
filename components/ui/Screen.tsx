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

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: ScreenProps) {
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
  const Content = (
    <>
      {loading && <Loading />}
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {children}
      </View>
    </>
  );

  return (
    <>
      <StatusBar
        style={theme == "light" ? "dark" : "light"}
        backgroundColor={colors.primarySoft}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {scroll ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {Content}
            </ScrollView>
          ) : (
            Content
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
