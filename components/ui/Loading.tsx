import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const Loading = () => {
  const { theme, colors } = useTheme();
  return (
    <>
      <StatusBar style={theme == 'light' ? 'dark' : 'light'} backgroundColor={colors.primarySoft} />
      <LinearGradient
        colors={[colors.primarySoft, colors.bg]}
        className="absolute inset-0 z-50 h-dvh w-screen items-center justify-center backdrop-blur-lg">
        {/* style={{ backgroundColor: colors.primarySoft }}> */}
        {/* style={{ backgroundColor: theme == "light" ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.6)' }}> */}
        <View className="px-8 py-8" style={{ backgroundColor: colors.bgCard, borderRadius: 20 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </LinearGradient>
    </>
  );
};

export default Loading;
