import { View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Buttons";
import { useTheme } from "@/context/ThemeContext";

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen>
      <View className="flex-1 justify-between">
        <View className="gap-4">
          <AppText bold>
            Welcome to Appitor
          </AppText>
          <AppText muted>
            Appitor is a modern school management platform that helps
            teachers, students, and parents stay connected — all in one app.
          </AppText>
          <View
            className="mt-4 rounded-xl p-4"
            style={{
              backgroundColor: colors.primarySoft,
            }}
          >
            <AppText>
              📚 Attendance & Homework
            </AppText>
            <AppText>
              🧾 Fees & Payroll
            </AppText>
            <AppText>
              📢 Notices & Communication
            </AppText>
          </View>
        </View>
        <View className="gap-3">
          <Button
            title="Login to Appitor"
            onPress={() => router.push("/login")}
          />
          <AppText muted>
            Secure • Reliable • Built for schools
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
