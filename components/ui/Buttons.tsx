import { useTheme } from '@/context/ThemeContext';
import { Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'outline';

export function Button({
  title,
  variant = 'primary',
  onPress,
  disabled,
}: {
  title: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="items-center justify-center rounded-xl px-4 py-3"
      style={{
        backgroundColor: isPrimary ? colors.primary : 'transparent',
        borderWidth: 2,
        borderColor: isPrimary ? colors.primary : colors.border,
        opacity: disabled ? 0.5 : 1,
      }}>
      <Text
        style={{
          color: isPrimary ? '#fff' : colors.text,
          fontWeight: '600',
        }}>
        {title}
      </Text>
    </Pressable>
  );
}
