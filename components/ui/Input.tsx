import { View, TextInput, TextInputProps } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type InputProps = TextInputProps & {
  icon?: React.ReactNode;
};

export function Input({ icon, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
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
  );
}
