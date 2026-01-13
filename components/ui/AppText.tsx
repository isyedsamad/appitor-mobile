import { useTheme } from "@/context/ThemeContext";
import { Text, TextProps } from "react-native";

type TextSize = "heading" | "title" | "body" | "label" | "subtext" | "min";

type AppTextProps = TextProps & {
  size?: TextSize;
  muted?: boolean;
  bold?: boolean;
  semibold?: boolean;
  primary?: boolean;
};

export function AppText({
  children,
  size = "body",
  primary,
  muted,
  bold,
  semibold,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useTheme();

  const fontMap: Record<TextSize, { fontSize: number; fontWeight: any }> = {
    heading: { fontSize: 24, fontWeight: "700" },
    title: { fontSize: 18, fontWeight: "600" },
    body: { fontSize: 15, fontWeight: "400" },
    label: { fontSize: 13, fontWeight: "500" },
    subtext: { fontSize: 12, fontWeight: "400" },
    min: { fontSize: 11, fontWeight: 400 }
  };

  const base = fontMap[size];

  return (
    <Text
      {...props}
      style={[
        {
          fontSize: base.fontSize,
          fontWeight: bold ? "700" : semibold ? "500" : base.fontWeight,
          color: primary ? colors.primary : muted ? colors.textMuted : colors.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
