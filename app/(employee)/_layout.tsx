import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function EmployeeLayout() {
  const { schoolUser, isLoaded } = useAuth();

  if (!isLoaded) return <Stack screenOptions={{ headerShown: false }} />;

  if ((!schoolUser || schoolUser.roleName !== 'teacher') && isLoaded) {
    return <Redirect href="/welcome" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
