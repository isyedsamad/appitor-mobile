import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { changePasswordFirebase } from '@/lib/changePassword';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, LogOut, Moon, Repeat, Smartphone, Sun } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function EmployeeProfilePage() {
  const router = useRouter();
  const { schoolUser, isLoaded, handleSignOut, handleSwitch } = useAuth();
  const { themeMode, setThemeMode, colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  useEffect(() => {
    if (!schoolUser && isLoaded) router.replace('/');
  }, [schoolUser]);

  const THEMES = ['system', 'light', 'dark'] as const;
  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(themeMode) + 1) % THEMES.length];
    setThemeMode(next);
  }

  const initials = schoolUser.name
    .split(' ')
    .map((w: any) => w[0])
    .join('')
    .toUpperCase();

  async function handleChangePassword() {
    if (!password.current || !password.next || !password.confirm) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'All fields are required!',
      });
      return;
    }
    if (password.next !== password.confirm) {
      Toast.show({
        type: 'error',
        text1: 'Passwords Mismatch',
        text2: 'Re‑enter your password so both entries match',
      });
      return;
    }
    setLoadingPassword(true);
    await changePasswordFirebase(
      password.current,
      password.next,
      () => {
        Toast.show({
          type: 'success',
          text1: 'Password updated',
          text2: 'Please login again',
        });
        setLoadingPassword(false);
        handleSignOut();
      },
      (msg: any) => {
        setLoadingPassword(false);
        Toast.show({
          type: 'error',
          text1: 'Failed to Update Password',
          text2: msg,
        });
      }
    );
  }

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  return (
    <Screen scroll={false}>
      <Header title="My Profile" />
      <ScrollView>
        <View className="px-5 pb-10">
          <View
            className="mt-5 flex-row items-center gap-4 rounded-2xl p-5"
            style={{
              backgroundColor: colors.bgCard,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primarySoft }}>
              <AppText size="title" semibold primary>
                {initials}
              </AppText>
            </View>
            <View className="flex-1">
              <AppText size="title" semibold>
                {capitalizeWords(schoolUser.name)}
              </AppText>
              <AppText size="min" muted semibold>
                {schoolUser.role} • {schoolUser.employeeId}
              </AppText>
              <View className="mt-1 flex-row items-center gap-2">
                <StatusChip status={schoolUser.status} />
              </View>
            </View>
          </View>
          <InfoCard title="Personal Information">
            <InfoRow label="Mobile" value={schoolUser.mobile} />
            <InfoRow label="Email" value={schoolUser.email || '—'} />
            <InfoRow label="Gender" value={schoolUser.gender} />
          </InfoCard>
          <InfoCard title="School Information">
            <InfoRow label="School Name" value={schoolUser.schoolName} />
            <InfoRow label="School Code" value={schoolUser.schoolCode || '—'} />
            <InfoRow label="Branch" value={schoolUser.branchNames[0]} />
          </InfoCard>
          <InfoCard title="App Settings">
            <SettingRow
              icon={themeMode === 'dark' ? Moon : themeMode === 'light' ? Sun : Smartphone}
              label="Theme"
              value={themeMode.toUpperCase()}
              onPress={cycleTheme}
            />
          </InfoCard>
          <InfoCard title="Security">
            <TouchableOpacity
              onPress={() => setOpenPassword(!openPassword)}
              className="flex-row items-center justify-between px-6 pb-6 pt-3">
              <View className="flex-row items-center gap-3">
                <Lock size={18} color={colors.textMuted} />
                <AppText semibold>Change Password</AppText>
              </View>
              <AppText size="label" muted semibold>
                {openPassword ? 'HIDE' : ''}
              </AppText>
            </TouchableOpacity>
            {openPassword && (
              <View
                className="px-5 pb-5 pt-1"
                style={{ borderTopWidth: 1, borderColor: colors.border }}>
                <PasswordInput
                  label="Current Password"
                  value={password.current}
                  onChange={(v: any) => setPassword({ ...password, current: v })}
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                />
                <PasswordInput
                  label="New Password"
                  value={password.next}
                  onChange={(v: any) => setPassword({ ...password, next: v })}
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                />
                <PasswordInput
                  label="Confirm Password"
                  value={password.confirm}
                  onChange={(v: any) => setPassword({ ...password, confirm: v })}
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                />
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={loadingPassword}
                  className="mt-4 items-center rounded-xl py-4"
                  style={{ backgroundColor: colors.primary }}>
                  <AppText semibold style={{ color: '#fff' }}>
                    {!loadingPassword ? (
                      'Update Password'
                    ) : (
                      <ActivityIndicator size="small" color={'#fff'} />
                    )}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </InfoCard>
          <InfoCard>
            <ActionRow icon={Repeat} label="Switch Account" onPress={handleSwitch} />
            <ActionRow
              icon={LogOut}
              label="Logout"
              danger
              onPress={() => handleSignOut(schoolUser.uid)}
            />
          </InfoCard>
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoCard({ title, children }: any) {
  const { colors } = useTheme();
  return (
    <View
      className="mt-4 overflow-hidden rounded-2xl"
      style={{
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      {title && (
        <View className="bg-(--bg) px-5 py-3">
          <AppText size="label" muted>
            {title}
          </AppText>
        </View>
      )}
      {children}
    </View>
  );
}

function InfoRow({ label, value }: any) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row justify-between px-5 py-4"
      style={{ borderTopWidth: 1, borderColor: colors.border }}>
      <AppText muted>{label}</AppText>
      <AppText semibold>{value}</AppText>
    </View>
  );
}

function SettingRow({ icon: Icon, label, value, onPress }: any) {
  const { themeMode, colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between border-t px-5 py-4"
      style={{ borderColor: colors.border }}
      activeOpacity={0.7}>
      <View className="flex-row items-center gap-3">
        <Icon size={18} color={colors.textMuted} />
        <AppText semibold>{label}</AppText>
      </View>

      {value && (
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <AppText size="min" semibold muted>
            {value}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ActionRow({ icon: Icon, label, onPress, danger }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 px-6 py-4"
      style={{ borderTopWidth: 1, borderColor: colors.border }}>
      <Icon size={18} color={danger ? colors.statusAtext : colors.textMuted} />
      <AppText semibold style={danger ? { color: colors.statusAtext } : undefined}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

function StatusChip({ status }: any) {
  const { colors } = useTheme();
  const ui =
    status === 'active'
      ? {
          bg: colors.statusPbg,
          text: colors.statusPtext,
        }
      : {
          bg: colors.statusAbg,
          text: colors.statusAtext,
        };

  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: ui.bg }}>
      <AppText size="min" semibold style={{ color: ui.text }}>
        {status.toUpperCase()}
      </AppText>
    </View>
  );
}

function PasswordInput({ label, value, onChange, show, toggle }: any) {
  const { colors } = useTheme();
  return (
    <View className="mt-3">
      <AppText size="label" muted>
        {label}
      </AppText>
      <View
        className="mt-1 flex-row items-center rounded-xl border px-4 py-1"
        style={{ borderColor: colors.border }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          secureTextEntry={!show}
          className="flex-1"
        />
        <TouchableOpacity onPress={toggle}>
          {show ? (
            <EyeOff size={18} color={colors.textMuted} />
          ) : (
            <Eye size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
