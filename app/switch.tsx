import { Images } from '@/assets/images';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import { getAccounts, removeAccount, setActiveUID } from '@/lib/localAccounts';
import { getPassword } from '@/lib/secureCredentials';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  AlertTriangle,
  ChevronRight,
  GraduationCap,
  LogIn,
  Trash2,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function SwitchPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { setAuthState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [removeTarget, setRemoveTarget] = useState<any>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    const list = await getAccounts();
    setAccounts(list);
  }

  async function handleSwitch(account: any) {
    try {
      setLoading(true);
      const password = await getPassword(account.uid);
      if (!password) {
        Toast.show({ type: 'error', text1: 'Re-login required' });
        setLoading(false);
        return;
      }
      await signOut(auth);
      const cred = await signInWithEmailAndPassword(auth, account.email, password);
      await setActiveUID(cred.user.uid);
      setAuthState('ready');
      router.replace('/');
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to switch account' });
      setLoading(false);
    }
  }

  async function confirmRemove() {
    try {
      await removeAccount(removeTarget.uid);
      setRemoveTarget(null);
      await loadAccounts();
      Toast.show({ type: 'success', text1: 'Account removed' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to remove account' });
    }
  }

  const teachers = accounts.filter((a) => a.role === 'teacher');
  const students = accounts.filter((a) => a.role === 'student');

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <LinearGradient
        colors={[colors.primarySoft, colors.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.6]}
        className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="relative w-full items-center overflow-hidden pb-2 pt-12">
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
              <AppText
                size="subtext"
                className="text-center font-medium leading-6 opacity-60"
                style={{ maxWidth: 280 }}>
                Select a profile to continue your session.
              </AppText>
            </View>
          </View>
          <View className="px-7">
            {teachers.length > 0 && (
              <RoleSection
                label="ACADEMIC STAFF"
                icon={<User size={14} color={colors.primary} strokeWidth={2.5} />}
                items={teachers}
                onPress={handleSwitch}
                onLongPress={setRemoveTarget}
              />
            )}
            {students.length > 0 && (
              <RoleSection
                label="STUDENTS"
                icon={<GraduationCap size={16} color={colors.primary} strokeWidth={2.5} />}
                items={students}
                onPress={handleSwitch}
                onLongPress={setRemoveTarget}
              />
            )}
            <View className="mt-5">
              <TouchableOpacity
                onPress={() => router.replace('/login')}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-3 rounded-2xl border border-dashed py-4"
                style={{
                  borderColor: colors.border,
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}>
                <View className="bg-primary/10 h-8 w-8 items-center justify-center rounded-full">
                  <LogIn size={16} color={colors.primary} />
                </View>
                <AppText semibold style={{ color: colors.text }}>
                  Log in to another account
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Modal visible={!!removeTarget} transparent animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
            <View
              className="w-full max-w-sm overflow-hidden rounded-3xl border p-0"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}>
              <View className="bg-status-abg/10 items-center py-8">
                <View className="bg-status-abg/20 mb-4 h-16 w-16 items-center justify-center rounded-full">
                  <AlertTriangle size={32} color={colors.statusAtext} />
                </View>
                <AppText size="heading" bold className="text-center">
                  Remove Account?
                </AppText>
                <AppText muted className="mt-2 px-8 text-center text-sm">
                  Are you sure you want to remove <AppText bold>{removeTarget?.name}</AppText> from
                  this device?
                </AppText>
              </View>
              <View className="flex-row gap-3 border-t p-4" style={{ borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={() => setRemoveTarget(null)}
                  className="flex-1 items-center justify-center rounded-xl py-3.5"
                  style={{ backgroundColor: colors.bg }}>
                  <AppText semibold>Cancel</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmRemove}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3.5"
                  style={{ backgroundColor: colors.statusAbg }}>
                  <Trash2 size={16} color={colors.statusAtext} />
                  <AppText semibold style={{ color: colors.statusAtext }}>
                    Remove
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </Screen>
  );
}

function RoleSection({ label, items, onPress, onLongPress }: any) {
  const { colors, theme } = useTheme();
  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };
  return (
    <View className="mt-7">
      <AppText size="subtext" semibold className="mb-2 ml-1">
        {label}
      </AppText>
      <View className="gap-2">
        {items.map((acc: any) => (
          <TouchableOpacity
            key={acc.uid}
            onPress={() => onPress(acc)}
            onLongPress={() => onLongPress(acc)}
            delayLongPress={500}
            activeOpacity={0.7}
            className="group flex-row items-center rounded-xl border px-5 py-4"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            }}>
            <View
              className="mr-4 h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: colors.primarySoft,
                borderWidth: 1,
                borderColor: colors.primary + '22',
              }}>
              <AppText size="body" bold style={{ color: colors.primary }}>
                {acc.name?.[0]?.toUpperCase()}
              </AppText>
            </View>
            <View className="flex-1 justify-center gap-0.5">
              <AppText bold size="body" numberOfLines={1}>
                {capitalizeWords(acc.name)}
              </AppText>
              <View className="flex-row items-center gap-1.5">
                <AppText size="min" muted numberOfLines={1} semibold>
                  {capitalizeWords(acc.roleName)} • {acc.appId}
                </AppText>
              </View>
            </View>
            <View
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }}>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
