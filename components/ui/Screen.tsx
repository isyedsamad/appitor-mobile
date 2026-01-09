import { View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <>
    <StatusBar style="light" backgroundColor={colors.bg} />
    <SafeAreaView style={{ flex: 1 }}>
      <View className="p-5"
        style={{
          flex: 1,
          backgroundColor: colors.bg,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
    </>
  );
}
