"use client";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

type HeaderProps = {
  title: string;
  rightSlot?: React.ReactNode;
};

export function Header({ title, rightSlot }: HeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View className="overflow-hidden">
      <LinearGradient
        colors={[colors.primarySoft, colors.bg]}
        className="px-5 py-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="p-2 rounded-xl"
              style={{ backgroundColor: colors.bgCard }}
            >
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <AppText size="title" semibold>
              {title}
            </AppText>
          </View>

          {rightSlot && (
            <View className="items-center justify-center">
              {rightSlot}
            </View>
          )}
        </View>
      </LinearGradient>
      <View
        style={{
          height: 1.5,
          backgroundColor: colors.primary,
          opacity: 0.12,
        }}
      />
    </View>
  );
}
