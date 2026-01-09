import { Pressable, Text } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type ButtonVariant = "primary" | "outline";

export function Button({
  title,
  variant = "primary",
  onPress,
  disabled,
}: {
  title: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();

  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="px-4 py-3 rounded-lg items-center justify-center"
      style={{
        backgroundColor: isPrimary ? colors.primary : "transparent",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        style={{
          color: isPrimary ? "#fff" : colors.text,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
