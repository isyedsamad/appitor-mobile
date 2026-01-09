import { View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Images } from "@/assets/images";

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/welcome");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View
      className="flex-1 items-center justify-center px-32"
      style={{ backgroundColor: colors.bg }}
    >
        <Image
          source={Images.logowhite}
          resizeMode="contain" className="w-full"
        />
    </View>
  );
}
