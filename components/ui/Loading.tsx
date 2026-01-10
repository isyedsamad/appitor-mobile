import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const Loading = () => {
  const { theme, colors } = useTheme();
  return (
    <View className="absolute inset-0 z-50 w-screen h-screen items-center justify-center backdrop-blur-lg"
      style={{ backgroundColor: theme == "light" ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)' }}>
      <View className="px-6 py-6" style={{ backgroundColor: colors.bgCard, borderRadius: 20 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
};

export default Loading;
