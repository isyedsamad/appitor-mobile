import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CircleOff, Phone, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Linking, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

type RoleFilter = 'all' | 'teaching' | 'non-teaching';
export default function StudentEmployeesPage() {
  const { employeeData } = useAuth();
  const { colors } = useTheme();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('teaching');
  const [search, setSearch] = useState('');
  const filteredEmployees = useMemo(() => {
    let list = [...(employeeData || [])];
    list.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
    if (roleFilter !== 'all') {
      list = list.filter((e) => {
        const isTeaching = e.role?.toLowerCase().includes('teacher');
        return roleFilter === 'teaching' ? isTeaching : !isTeaching;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.name?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [employeeData, roleFilter, search]);

  function callEmployee(mobile: string) {
    if (!mobile)
      Toast.show({
        type: 'error',
        text1: 'Mobile Number not found!',
        text2: 'This employee has no phone number assigned by the school.',
      });
    Linking.openURL(`tel:${mobile}`);
  }

  return (
    <Screen scroll={false}>
      <Header title="Faculty Directory" />
      <View className="mt-5 px-5">
        <View
          className="flex-row items-center rounded-xl border px-5 py-2"
          style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          }}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search by name or ID"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            className="ml-3 flex-1"
            style={{ color: colors.text }}
          />
        </View>
      </View>
      <View className="mt-4 px-5">
        <View
          className="flex-row gap-2 rounded-2xl border p-1"
          style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          }}>
          <FilterTab
            label="Teaching"
            active={roleFilter === 'teaching'}
            onPress={() => setRoleFilter('teaching')}
          />
          <FilterTab
            label="Non-Teaching"
            active={roleFilter === 'non-teaching'}
            onPress={() => setRoleFilter('non-teaching')}
          />
        </View>
      </View>
      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{
          paddingTop: 15,
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 30,
          gap: 12,
        }}
        ListEmptyComponent={() => (
          <View className="items-center px-10 py-12">
            <CircleOff size={32} color={colors.primary} />
            <AppText semibold className="mt-5">
              No Employee Found!
            </AppText>
            <AppText size="subtext" muted semibold className="text-center"></AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <EmployeeCard employee={item} onCall={() => callEmployee(item.mobile)} />
        )}
      />
    </Screen>
  );
}

function FilterTab({ label, active, onPress }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center rounded-xl py-2"
      style={{
        backgroundColor: active ? colors.primarySoft : 'transparent',
      }}>
      <AppText
        size="label"
        semibold
        style={{
          color: active ? colors.primary : colors.textMuted,
        }}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

function EmployeeCard({ employee, onCall }: any) {
  const { colors } = useTheme();

  const initials = employee.name
    ?.split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  const isTeaching = employee.role?.toLowerCase().includes('teacher');
  return (
    <View
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: colors.bgCard,
        borderColor: colors.border,
      }}>
      <View className="flex-row items-center gap-4">
        <View
          className="h-14 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.primarySoft }}>
          <AppText size="body" semibold primary>
            {initials}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText size="body" semibold>
            {capitalizeWords(employee.name)}
          </AppText>
          <View className="mt-1 flex-row items-center gap-2">
            <RoleChip teaching={isTeaching} />
            <AppText size="min" muted semibold>
              {employee.employeeId}
            </AppText>
          </View>
        </View>
        <TouchableOpacity
          onPress={onCall}
          activeOpacity={0.85}
          className="rounded-xl p-3"
          style={{ backgroundColor: colors.primary }}>
          <Phone size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RoleChip({ teaching }: { teaching: boolean }) {
  const { colors } = useTheme();
  const ui = teaching
    ? {
        bg: colors.statusPbg,
        text: colors.statusPtext,
        label: 'TEACHING',
      }
    : {
        bg: colors.statusLbg,
        text: colors.statusLtext,
        label: 'NON-TEACHING',
      };

  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: ui.bg }}>
      <AppText size="min" semibold style={{ color: ui.text }}>
        {ui.label}
      </AppText>
    </View>
  );
}
