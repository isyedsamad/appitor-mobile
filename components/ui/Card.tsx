import { View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-xl p-5"
      style={{
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}
