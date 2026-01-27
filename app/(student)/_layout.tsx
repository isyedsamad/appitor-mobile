import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function StudentLayout() {
  const { schoolUser, isLoaded } = useAuth();

  if (!isLoaded) return <Stack screenOptions={{ headerShown: false }} />;

  if ((!schoolUser || schoolUser.roleId !== 'student') && isLoaded) {
    return <Redirect href="/welcome" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
