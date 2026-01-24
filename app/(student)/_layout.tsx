import { useAuth } from '@/context/AuthContext';
import { Redirect, Slot } from 'expo-router';

export default function EmployeeLayout() {
  const { schoolUser, isLoaded } = useAuth();

  if (!isLoaded) return <Slot />;
  if ((!schoolUser || schoolUser.roleId !== 'student') && isLoaded) {
    return <Redirect href="/welcome" />;
  }

  return <Slot />;
}
