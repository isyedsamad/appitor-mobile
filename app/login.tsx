import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  View,
} from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";

import { Images } from "@/assets/images";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { login } from "@/services/auth.service";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import Toast from "react-native-toast-message";

type School = {
  id: string;
  name: string;
  code: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { isLoaded, loading, schoolUser } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schoolLoading, setSchoolLoading] = useState("Loading.. Please wait")

  // useEffect(() => {
  //   if(schoolUser) {
  //     if (schoolUser.roleName === "teacher") {
  //       router.replace("./(employee)/dashboard");
  //     } else if (schoolUser.roleName === "student") {
  //       router.replace("./(student)/dashboard");
  //     } else {
  //       router.replace("/welcome");
  //     }
  //   }
  // }, [schoolUser])

  useEffect(() => {
    let isActive = true;
    async function fetchSchools() {
      try {
        const snap = await getDocs(collection(db, "schools"));
        if(isActive) {
          setSchools(
            snap.docs.map((doc) => ({
              id: doc.id,
              name: doc.data().name,
              code: doc.data().code,
            }))
          );
          setSchoolLoading("Select your School");
        }
      } catch (e) {
        console.log("Login fetch error:", e);
      }
    }
    fetchSchools();
    return () => { isActive = false; };
  }, []);

  async function handleLogin() {
    if (!schoolId) {
      Toast.show({
        type: "error",
        text1: "Select your School",
        text2: "Please select your school from the List",
      });
      return;
    }
    if (!username || !password) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill all fields!",
      });
      return;
    }
    const email = `${username.trim().toLowerCase()}@${schoolCode.toLowerCase()}.appitor`;
    try {
      const loginInfo = await login(email, password);
      if(!loginInfo.success) {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: "" + loginInfo.msg,
        });
      }else {
        router.replace("/");
      }
    } catch(err) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: "Failed: " + err,
      });
    }
  }

  return (
    <Screen>
      <View className="flex-1">
        <View
          className="px-5 pt-12 pb-10 items-center"
          style={{ backgroundColor: colors.bg }}
        >
          {theme == "light" ? <Image
            source={Images.logoblack}
            resizeMode="contain"
            style={{ width: 96, height: 28 }}
          /> : <Image
            source={Images.logowhite}
            resizeMode="contain"
            style={{ width: 96, height: 28 }}
          />}
          <View className="mt-5">
            <AppText size="heading" bold>
              Welcome back
            </AppText>
            <AppText size="subtext" muted>
              Sign in to continue to Appitor
            </AppText>
          </View>
        </View>
        <View className="px-3 -mt-4">
          <Card>
            <View className="gap-5 py-1">
              <View
                className="rounded-md px-2"
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                }}
              >
                <Picker
                  selectedValue={schoolId}
                  style={{ color: colors.text }}
                  onValueChange={(value) => {
                    const selected = schools.find((s) => s.id === value);
                    setSchoolId(value);
                    setSchoolCode(selected?.code || "");
                  }}
                >
                  <Picker.Item label={schoolLoading} value="" />
                  {schools.map((s) => (
                    <Picker.Item
                      key={s.id}
                      label={`${s.name} (${s.code.toUpperCase()})`}
                      value={s.id}
                    />
                  ))}
                </Picker>
              </View>
              <Input
                label="School App ID"
                placeholder="i.e. A2500001"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                icon={
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                }
              />
              <Input
                label="Password (DOB for Students)"
                placeholder="i.e. DDMMYYYY"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                icon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                }
              />
              <Pressable
                onPress={() =>
                  Toast.show({
                    type: "info",
                    text1: "Password reset",
                    text2: "Please contact your school administration",
                  })
                }
                className="self-end"
              >
                <AppText size="subtext" muted>
                  Forgot password?
                </AppText>
              </Pressable>
              <Button
                title={loading ? "Signing in..." : "Login"}
                onPress={handleLogin}
                disabled={loading || !isLoaded}
              />
              {(loading || !isLoaded) && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
            <View className="flex-row justify-between mt-1">
              <Pressable onPress={() => Toast.show({ type: "info", text1: "Opening Terms & Conditions" })}>
                <AppText size="subtext" muted>
                  Terms & Conditions
                </AppText>
              </Pressable>
              <Pressable onPress={() => Toast.show({ type: "info", text1: "Opening Privacy Policy" })}>
                <AppText size="subtext" muted>
                  Privacy Policy
                </AppText>
              </Pressable>
            </View>
          </Card>
        </View>
        {/* <View className="absolute bottom-2 w-full items-center gap-1"> */}
        <View className="w-full items-center gap-1 mt-5">
          <View className="flex-row gap-1 mb-1">
            <AppText size="subtext" muted bold>
              Developed by
            </AppText>
            <AppText size="subtext" primary bold>
              Appitor
            </AppText>
          </View>
          <AppText size="subtext" muted>
            Made with ❤️ in India
          </AppText>
          <AppText size="subtext" muted>
            © {new Date().getFullYear()} Appitor. All rights reserved.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
