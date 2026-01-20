import { Images } from '@/assets/images';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { schoolUser, loading, isLoaded } = useAuth();
  const { theme, colors } = useTheme();

  useEffect(() => {
    if (!isLoaded) return;
    if (!schoolUser) {
      router.replace('/welcome');
      return;
      // const timer = setTimeout(() => {
      //   router.replace("/welcome");
      // }, 2000);
      // return () => clearTimeout(timer);
    }
    if (schoolUser.roleName === 'teacher') {
      router.replace('/(employee)/dashboard');
    } else if (schoolUser.roleName === 'student') {
      router.replace('/(student)/dashboard');
    } else {
      router.replace('/welcome');
    }
  }, [schoolUser, isLoaded]);
  return (
    <Screen>
      <LinearGradient
        colors={[colors.primarySoft, colors.bg]}
        className="flex-1 items-center justify-center gap-8"
        style={{ backgroundColor: colors.bg }}>
        {theme == 'light' ? (
          <Image source={Images.logoblack} resizeMode="contain" style={{ width: 96, height: 28 }} />
        ) : (
          <Image source={Images.logowhite} resizeMode="contain" style={{ width: 96, height: 28 }} />
        )}
        <ActivityIndicator size="small" color={colors.primary} />
      </LinearGradient>
    </Screen>
  );
}
