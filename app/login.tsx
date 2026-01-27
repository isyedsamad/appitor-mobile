import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { ChevronDown, ChevronRightCircle, Lock, User, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Buttons';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';

import { Images } from '@/assets/images';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { login } from '@/services/auth.service';
import { LinearGradient } from 'expo-linear-gradient';

type School = {
  id: string;
  name: string;
  code: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const { loading, isLoaded } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [schoolModal, setSchoolModal] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(true);
  const [schoolLoadingText, setSchoolLoadingText] = useState('Loading schools…');

  useEffect(() => {
    let active = true;
    async function fetchSchools() {
      setLoadingLogin(true);
      try {
        const snap = await getDocs(collection(db, 'schools'));
        if (!active) return;
        setSchools(
          snap.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            code: doc.data().code,
          }))
        );
        setSchoolLoadingText('Select your school');
      } catch (e) {
        console.log('School fetch error:', e);
        setSchoolLoadingText('Failed to load schools');
      } finally {
        setLoadingLogin(false);
      }
    }
    fetchSchools();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin() {
    if (!schoolId) {
      Toast.show({
        type: 'error',
        text1: 'Select your school',
        text2: 'Please choose your school to continue',
      });
      return;
    }
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Please fill all required fields',
      });
      return;
    }
    const email = `${username.trim().toLowerCase()}@${schoolCode.toLowerCase()}.appitor`;
    setLoadingLogin(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        Toast.show({
          type: 'error',
          text1: 'Login failed',
          text2: String(res.msg),
        });
        return;
      }
      router.replace('/');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: String(err),
      });
    } finally {
      setLoadingLogin(false);
    }
  }

  if (loadingLogin) return <Loading />;

  return (
    <Screen scroll={false}>
      <LinearGradient
        colors={[colors.primarySoft, colors.bg]}
        locations={[0.2, 1]}
        className="flex-1">
        <ScrollView>
          <View className="relative w-full items-center overflow-hidden pb-10 pt-10">
            <View
              className="mb-5 items-center justify-center rounded-full border px-6 py-3 shadow-sm"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.3)',
                borderColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              }}>
              <Image
                source={theme === 'light' ? Images.logoblack : Images.logowhite}
                resizeMode="contain"
                style={{ width: 70, height: 20, opacity: 0.9 }}
              />
            </View>
            <View className="items-center px-5">
              <AppText size="heading" className="text-center tracking-tighter">
                Welcome Back.
              </AppText>
              <View
                className="my-2 h-1 w-8 rounded-full opacity-20"
                style={{ backgroundColor: colors.text }}
              />
              <AppText size="subtext" className="text-center leading-6 opacity-60">
                Signin to continue to appitor.
              </AppText>
            </View>
          </View>
          <View className="-mt-4 px-5">
            <View
              className="rounded-2xl p-6"
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View className="gap-5">
                <View>
                  <AppText size="label" muted semibold>
                    School
                  </AppText>
                  <Pressable
                    onPress={() => setSchoolModal(true)}
                    className="mt-1 flex-row items-center justify-between rounded-md px-3 py-3"
                    style={{
                      backgroundColor: colors.bgCard,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                    }}>
                    <AppText muted={!schoolId}>
                      {schoolId
                        ? `${schools.find((s) => s.id === schoolId)?.name} (${schoolCode.toUpperCase()})`
                        : schoolLoadingText}
                    </AppText>
                    <ChevronDown size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
                <Input
                  label="School App ID"
                  placeholder="e.g. A2500001"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  icon={<User size={18} color={colors.textMuted} />}
                />
                <Input
                  label="Password (DOB for students)"
                  placeholder="DDMMYYYY"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  icon={<Lock size={18} color={colors.textMuted} />}
                />
                <Pressable
                  onPress={() =>
                    Toast.show({
                      type: 'error',
                      text1: 'Password reset',
                      text2: 'Please contact your school administration',
                    })
                  }
                  className="self-end">
                  <AppText size="subtext" muted>
                    Forgot password?
                  </AppText>
                </Pressable>
                <Button
                  title={loading ? 'Signing in…' : 'Login'}
                  onPress={handleLogin}
                  disabled={loading || !isLoaded}
                />
                {(loading || !isLoaded) && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>
              <View className="mt-4 flex-row justify-between">
                <Pressable
                  onPress={() => Toast.show({ type: 'info', text1: 'Opening Terms & Conditions' })}>
                  <AppText size="subtext" muted>
                    Terms & Conditions
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => Toast.show({ type: 'info', text1: 'Opening Privacy Policy' })}>
                  <AppText size="subtext" muted>
                    Privacy Policy
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
          <View className="mt-6 items-center gap-1">
            <View className="flex-row gap-1">
              <AppText size="subtext" muted bold>
                Developed by
              </AppText>
              <AppText size="subtext" primary bold>
                Appitor
              </AppText>
            </View>
            <AppText size="subtext" muted>
              © {new Date().getFullYear()} Appitor. All rights reserved.
            </AppText>
          </View>

          <Modal
            visible={schoolModal}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={() => setSchoolModal(false)}>
            <View className="flex-1 justify-end bg-black/60">
              <View
                className="max-h-[70vh] rounded-t-3xl px-8 py-7"
                style={{ backgroundColor: colors.bgCard }}>
                <View className="mb-3 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <ChevronRightCircle size={20} color={colors.primary} />
                    <AppText size="title" semibold>
                      Select School
                    </AppText>
                  </View>
                  <Pressable onPress={() => setSchoolModal(false)}>
                    <X size={22} color={colors.textMuted} />
                  </Pressable>
                </View>
                <FlatList
                  data={schools}
                  className="mx-2"
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSchoolId(item.id);
                        setSchoolCode(item.code);
                        setSchoolModal(false);
                      }}
                      style={{
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}>
                      <AppText bold>{item.name}</AppText>
                      <AppText size="subtext" muted>
                        {item.code.toUpperCase()}
                      </AppText>
                    </Pressable>
                  )}
                />
              </View>
            </View>
          </Modal>
        </ScrollView>
      </LinearGradient>
    </Screen>
  );
}
