import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Loading from "./Loading";

export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { loading, isLoaded } = useAuth();
  return (
    <>
    <StatusBar style="light" backgroundColor={colors.bg} />
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {(loading) && <Loading />}
        <View className="p-5"
          style={{
            flex: 1,
            backgroundColor: colors.bg,
          }}
        >
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}
