import { View, Image, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { AppText } from "@/components/ui/AppText";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Buttons";

import { useTheme } from "@/context/ThemeContext";
import { Images } from "@/assets/images";
// later → import { fetchSchools, loginSchoolUser } from "@/services/auth.service";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [schools, setSchools] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // fetchSchools().then(setSchools);
  }, []);

  async function handleLogin() {
    setError("");
    setLoading(true);

    const finalEmail =
      email.trim() + "@" + schoolCode.toLowerCase() + ".appitor";

    try {
      // const res = await loginSchoolUser({
      //   schoolId,
      //   email: finalEmail,
      //   password,
      // });

      // if (res.success) {
      //   router.replace("/dashboard");
      // }

      setTimeout(() => {
        router.replace("/welcome"); // TEMP
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="w-full flex-1 justify-center">
        <Card>
          <View className="items-center mb-6">
            <View
              className="h-12 w-12 rounded-full items-center justify-center"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={30}
                color={colors.primary}
              />
            </View>
            <AppText bold size="title" className="mt-4">School Login</AppText>
            <AppText muted size="subtext">
              Secure access for schools & staff
            </AppText>
          </View>
          <View className="gap-4">
            <Input
              placeholder="School code"
              value={schoolCode}
              onChangeText={setSchoolCode}
              icon={
                <Ionicons
                  name="school-outline"
                  size={18}
                  color={colors.textMuted}
                />
              }
            />
            <Input
              placeholder="School ID / Username"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              icon={
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textMuted}
                />
              }
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textMuted}
                />
              }
            />
            {error ? (
              <AppText muted={false}>
                <AppText>{error}</AppText>
              </AppText>
            ) : null}
            <Button
              title={loading ? "Logging in..." : "Login"}
              onPress={handleLogin}
              disabled={loading}
            />
            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            )}
          </View>
        </Card>
      </View>
    </Screen>
  );
}
