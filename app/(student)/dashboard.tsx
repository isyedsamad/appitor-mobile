import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Buttons";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/services/auth.service";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";

export default function StudentDashboard() {
  const { schoolUser, isLoaded } = useAuth();
  const router = useRouter();
  async function handleLogout() {
    try {
      await logout();
      Toast.show({
        type: "success",
        text1: "Logged out",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Logout failed",
      });
    }
  }
  useEffect(() => {
    if (!isLoaded) return;
    if (!schoolUser) {
      router.replace("/welcome");
    }
  }, [schoolUser, isLoaded]);
  return (
    <Screen>
      <View>
        <AppText size="heading">Hello Student!</AppText>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </Screen>
  );
}
