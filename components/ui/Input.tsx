import { useTheme } from "@/context/ThemeContext";
import { Text, TextInput, TextInputProps, View } from "react-native";

type InputProps = TextInputProps & {
  icon?: React.ReactNode;
  label?: string;
};

export function Input({ icon, label, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View className="space-y-1">
      {label && (
        <Text
          className="font-semibold text-sm"
          style={{ color: colors.textMuted }}
        >
          {label}
        </Text>
      )}
      <View
        className="flex-row items-center gap-3 rounded-md px-3"
        style={{
          backgroundColor: colors.bgCard,
          borderWidth: 1.5,
          borderColor: colors.border,
          height: 44,
        }}
      >
        {icon && <View>{icon}</View>}
        <TextInput
          {...props}
          placeholderTextColor={colors.textMuted}
          style={[
            {
              flex: 1,
              color: colors.text,
              fontSize: 15,
            },
            style,
          ]}
        />
      </View>
    </View>
  );
}
