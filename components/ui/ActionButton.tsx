import { Pressable } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export function ActionButton({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="p-2 rounded-md"
      style={{
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </Pressable>
  );
}
