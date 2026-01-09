import { Text, TextProps } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type TextSize = "heading" | "title" | "body" | "label" | "subtext";

type AppTextProps = TextProps & {
  size?: TextSize;
  muted?: boolean;
  bold?: boolean;
};

export function AppText({
  children,
  size = "body",
  muted,
  bold,
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
  };

  const base = fontMap[size];

  return (
    <Text
      {...props}
      style={[
        {
          fontSize: base.fontSize,
          fontWeight: bold ? "700" : base.fontWeight,
          color: muted ? colors.textMuted : colors.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
