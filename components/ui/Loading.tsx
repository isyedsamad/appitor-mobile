import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const Loading = () => {
  const { theme, colors } = useTheme();
  return (
    <LinearGradient colors={[colors.primarySoft, colors.bg]} className="absolute inset-0 z-50 w-screen h-dvh items-center justify-center backdrop-blur-lg">
      {/* style={{ backgroundColor: colors.primarySoft }}> */}
      {/* style={{ backgroundColor: theme == "light" ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)' }}> */}
      <View className="px-8 py-8" style={{ backgroundColor: colors.bgCard, borderRadius: 20 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </LinearGradient>
  );
};

export default Loading;
