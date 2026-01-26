'use client';

import { TodayEmployeeAttendanceCard } from '@/components/employee/TodayEmployeeAttendanceCard';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import type { LucideIcon } from 'lucide-react-native';
import {
  AlarmClock,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
  GraduationCap,
  IndianRupee,
  Library,
  NotebookText,
  Sun,
  Sunrise,
  Sunset,
  User2,
  Users,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { schoolUser, isLoaded, sessionAttData } = useAuth();
  const { colors } = useTheme();
  // const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);
  // useEffect(() => {
  //   if (!schoolUser) return;
  //   const ref = doc(
  //     db,
  //     "schools",
  //     schoolUser.schoolId,
  //     "branches",
  //     schoolUser.currentBranch,
  //     "employees",
  //     schoolUser.uid,
  //     "dashboard",
  //     "main"
  //   );
  //   return onSnapshot(ref, snap => {
  //     setDashboard(snap.exists() ? snap.data() : null);
  //     setLoading(false);
  //   });
  // }, [schoolUser]);
  // const teacher = dashboard?.teacher ?? {};

  useEffect(() => {
    if (!schoolUser) return;
    const loadAttendance = async () => {
      try {
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(
          today.getMonth() + 1
        ).padStart(2, '0')}-${today.getFullYear()}`;
        const docId = `student_${dateStr}_${schoolUser.className}_${schoolUser.section}`;
        const docRef = doc(
          db,
          'schools',
          schoolUser.schoolId,
          'branches',
          schoolUser.currentBranch,
          'attendance',
          docId
        );
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setAttendance(null);
        } else {
          const data: any = snap.data();
          const status = data.records?.[schoolUser.uid] ?? null;
          setAttendance({
            date: data.date,
            status,
            locked: data.locked,
          });
        }
      } catch (error) {
        console.error('Error loading attendance:', error);
        setAttendance(null);
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [schoolUser]);

  const statusKey = attendance?.status ?? 'M';
  const statusMap: any = {
    P: {
      label: 'Present',
      bg: colors.statusPbg,
      text: colors.statusPtext,
      border: colors.statusPborder,
      note: 'You were marked present today',
    },
    A: {
      label: 'Absent',
      bg: colors.statusAbg,
      text: colors.statusAtext,
      border: colors.statusAborder,
      note: 'You were marked absent today',
    },
    L: {
      label: 'On Leave',
      bg: colors.statusLbg,
      text: colors.statusLtext,
      border: colors.statusLborder,
      note: 'Approved leave for today',
    },
    H: {
      label: 'Half Day',
      bg: colors.statusHbg,
      text: colors.statusHtext,
      border: colors.statusHborder,
      note: 'Half day attendance recorded',
    },
    O: {
      label: 'Over Time',
      bg: colors.statusObg,
      text: colors.statusOtext,
      border: colors.statusOborder,
      note: 'Overtime recorded for today',
    },
    M: {
      label: 'Not Marked',
      bg: colors.warningSoft,
      text: colors.warning,
      border: colors.border,
      note: 'Attendance not marked yet',
    },
  };

  const status = statusMap[statusKey];
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  const safePercent = (p: number, total: number) =>
    total === 0 ? 0 : Math.round((p / total) * 100);

  const summary = useMemo(() => {
    let P = 0,
      A = 0,
      L = 0,
      M = 0;
    Object.values(sessionAttData?.months || {}).forEach((m: any) => {
      P += m.P || 0;
      A += m.A || 0;
      L += m.L || 0;
      M += m.M || 0;
    });
    const total = P + A + L + M;
    return { P, A, L, M, total };
  }, [sessionAttData]);

  useEffect(() => {
    if (!schoolUser && isLoaded) router.replace('/');
  }, [schoolUser]);

  return (
    <>
      {loading && <Loading />}
      <Screen>
        <DashboardHeader
          schoolName={schoolUser.schoolName}
          userName={schoolUser.name}
          onNotificationPress={() => router.push('/(employee)/notifications')}
        />
        {/* <View
        className="px-8 py-4 border-b-2 border-l-2 border-r-2 rounded-b-3xl"
        style={{
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        }}
      >
        <AppText size="label" bold className="text-center uppercase">
          {schoolUser.schoolName}
        </AppText>
        <View className="flex-row items-center mt-4 justify-between">
          <View className="justify-between">
            <AppText size="subtext" muted>
              Welcome back!
            </AppText>
            <AppText size="title" bold>
              {schoolUser.name}
            </AppText>
          </View>
          <TouchableOpacity className="p-3 border rounded-full" style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            onPress={() => router.push("/(employee)/notifications")}
          >
            <Bell size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View> */}

        <View className="px-5">
          <View className="mt-7 flex-row gap-3">
            <Shortcut
              icon={<AlarmClock size={22} color={colors.primary} />}
              label="Attendance"
              onPress={() => router.push('/(student)/my-attendance')}
            />
            <Shortcut
              icon={<CalendarDays size={22} color={colors.primary} />}
              label="Timetable"
              onPress={() => router.push('/(student)/timetable')}
            />
            <Shortcut
              icon={<BadgeCheck size={22} color={colors.primary} />}
              label="Assignment"
              onPress={() => router.push('/(student)/assignment')}
            />
            <Shortcut
              icon={<CalendarDays size={22} color={colors.primary} />}
              label="Holiday"
              onPress={() => router.push('/(student)/holiday')}
            />
          </View>

          <TodayEmployeeAttendanceCard statusKey={statusKey} dateLabel={dateLabel} />

          <View className="mt-6 flex-row gap-4">
            <BigAction
              icon={<IndianRupee size={24} color={colors.primary} />}
              label="Fee Portal"
              description="monthly fee details and history"
              helper="Accounts"
              onPress={() => router.push('/(student)/fees')}
            />
            <BigAction
              icon={<FileText size={24} color={colors.primary} />}
              label="Homework"
              description="check and submit homework"
              helper="Academic"
              onPress={() => router.push('/(student)/homework')}
            />
          </View>

          <View
            className="mt-4 rounded-2xl p-5"
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <View>
                <AppText semibold>{schoolUser.currentSession}</AppText>
                <AppText size="min" muted semibold>
                  {summary.total == 0 ? summary.total : summary.total.toString().padStart(2, '0')}{' '}
                  Working Days
                </AppText>
              </View>
              <View className="rounded-lg px-3 py-1" style={{ backgroundColor: colors.primary }}>
                <AppText semibold alwaysWhite>
                  {safePercent(summary.P, summary.total)} %
                </AppText>
              </View>
            </View>
            {summary.total != 0 && safePercent(summary.P, summary.total) < 75 && (
              <AppText size="subtext" style={{ color: colors.statusAtext }}>
                ⚠ Attendance below recommended level
              </AppText>
            )}
            <View className="mt-4 flex-row justify-around">
              {[
                ['Present', summary.P, colors.statusPbg, colors.statusPtext],
                ['Absent', summary.A, colors.statusAbg, colors.statusAtext],
                ['Leave', summary.L, colors.statusLbg, colors.statusLtext],
                ['Medical', summary.M, colors.statusMbg, colors.statusMtext],
              ].map(([label, val, bg, tx]: any) => (
                <View key={label} className="items-center">
                  <AppText size="min" muted semibold>
                    {label}
                  </AppText>
                  <View className="mt-1 rounded-lg px-3 py-2" style={{ backgroundColor: bg }}>
                    <AppText size="title" semibold style={{ color: tx }}>
                      {val == 0 ? val : val.toString().padStart(2, '0')}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Section title="Academic Portal">
            <PortalGrid>
              <PortalItem
                icon={<Library size={24} color={colors.primary} />}
                label="Online Class"
                onPress={() => router.push('/(employee)/online-class')}
              />
              <PortalItem
                icon={<GraduationCap size={24} color={colors.primary} />}
                label="Exam Portal"
                onPress={() => router.push('/(student)/exams')}
              />
              <PortalItem
                icon={<Users size={24} color={colors.primary} />}
                label="Employee"
                onPress={() => router.push('/(student)/employees')}
              />
              <PortalItem
                icon={<AlarmClock size={24} color={colors.primary} />}
                label="My Attendance"
                onPress={() => router.push('/(student)/my-attendance')}
              />
              <PortalItem
                icon={<CalendarDays size={24} color={colors.primary} />}
                label="Timetable"
                onPress={() => router.push('/(student)/timetable')}
              />
              <PortalItem
                icon={<BadgeCheck size={24} color={colors.primary} />}
                label="Assignment"
                onPress={() => router.push('/(student)/assignment')}
              />
            </PortalGrid>
          </Section>
          <Section title="Utilities">
            <PortalGrid>
              <PortalItem
                icon={<BookOpen size={24} color={colors.primary} />}
                label="Salary"
                onPress={() => router.push('/(employee)/salary')}
              />
              <PortalItem
                icon={<FileText size={24} color={colors.primary} />}
                label="Leave Portal"
                onPress={() => router.push('/(student)/leave')}
              />
              <PortalItem
                icon={<Bell size={24} color={colors.primary} />}
                label="Complaint"
                onPress={() => router.push('/(student)/complaint')}
              />
              <PortalItem
                icon={<CalendarDays size={24} color={colors.primary} />}
                label="Holiday"
                onPress={() => router.push('/(student)/holiday')}
              />
              <PortalItem
                icon={<NotebookText size={24} color={colors.primary} />}
                label="Study Material"
                onPress={() => router.push('/(employee)/study-material')}
              />
              <PortalItem
                icon={<User2 size={24} color={colors.primary} />}
                label="My Profile"
                onPress={() => router.push('/(student)/profile')}
              />
            </PortalGrid>
          </Section>
        </View>
        <View style={{ borderBottomWidth: 1, borderColor: colors.border, marginTop: 25 }} />
        <View className="mb-4 mt-8 w-full items-center gap-1">
          <View className="mb-1 flex-row gap-1">
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
      </Screen>
    </>
  );
}

function getGreeting(): { text: string; Icon: LucideIcon } {
  const hour = new Date().getHours();

  if (hour < 12) {
    return { text: 'Good Morning', Icon: Sunrise };
  }
  if (hour < 17) {
    return { text: 'Good Afternoon', Icon: Sun };
  }
  return { text: 'Good Evening', Icon: Sunset };
}

export function DashboardHeader({
  schoolName,
  userName,
  onNotificationPress,
}: {
  schoolName: string;
  userName: string;
  onNotificationPress: () => void;
}) {
  const { colors } = useTheme();
  const { text: greeting, Icon } = getGreeting();
  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  return (
    <View className="overflow-hidden">
      <LinearGradient colors={[colors.primarySoft, colors.bg]} className="px-6 pb-6 pt-5">
        <AppText size="label" bold className="text-center uppercase tracking-widest">
          {schoolName}
        </AppText>
        <View className="mt-5 flex-row items-start justify-between">
          <View className="flex-1">
            <AppText size="subtext" muted bold>
              Welcome back 👋
            </AppText>
            <AppText size="heading" bold style={{ marginTop: 1 }}>
              {capitalizeWords(userName)}
            </AppText>
            <AppText size="subtext" muted>
              {new Date().toDateString()}
            </AppText>
            <View
              className="mt-3 self-start rounded-full px-4 py-2"
              style={{ backgroundColor: colors.primarySoft }}>
              <View className="flex-row items-center gap-2">
                <Icon size={16} color={colors.primary} />
                <AppText size="subtext" bold>
                  {greeting}!
                </AppText>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={onNotificationPress}
            activeOpacity={0.85}
            className="rounded-2xl border p-3"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            }}>
            <Bell size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View
        style={{
          height: 1.5,
          backgroundColor: colors.primary,
          opacity: 0.12,
        }}
      />
    </View>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-1 items-center">
      <View
        className="h-14 w-14 items-center justify-center rounded-xl border"
        style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
        {icon}
      </View>
      <AppText size="min" muted semibold className="mt-2 text-center">
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

function BigAction({
  icon,
  label,
  description,
  onPress,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  helper?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} className="flex-1">
      <LinearGradient
        colors={[colors.primarySoft, colors.bgCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-4"
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
        }}>
        <View className="flex-row items-center justify-between">
          <View
            className="h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: colors.bg }}>
            {icon}
          </View>
          <AppText size="body" muted>
            <ChevronRight size={18} color={colors.text} />
          </AppText>
        </View>
        <View className="mt-4">
          <AppText size="title" bold>
            {label}
          </AppText>
          {description && (
            <AppText size="subtext" muted style={{ marginTop: 4 }}>
              {description}
            </AppText>
          )}
          {helper && (
            <View
              className="mt-3 self-start rounded-full px-3 py-1.5"
              style={{ backgroundColor: colors.primarySoft }}>
              <AppText size="subtext" primary>
                {helper}
              </AppText>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function Section({ title, children }: any) {
  const { colors } = useTheme();
  return (
    <View className="mt-7">
      <View className="mb-4 flex-row items-center justify-center gap-5">
        <View className="flex-1" style={{ borderBottomWidth: 1.4, borderColor: colors.border }} />
        <AppText size="label" semibold muted className="text-center">
          {title}
        </AppText>
        <View className="flex-1" style={{ borderBottomWidth: 1.4, borderColor: colors.border }} />
      </View>
      <View className="px-2 py-2">{children}</View>
    </View>
  );
}

function PortalGrid({ children }: any) {
  return <View className="flex-row flex-wrap justify-between gap-y-6">{children}</View>;
}

function PortalItem({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  badge?: string;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="w-[30%] items-center">
      {/* <View
        className="w-full py-5 items-center justify-center rounded-xl"
        style={{
          backgroundColor: colors.primarySoft,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      > */}
      <LinearGradient
        colors={[colors.bg, colors.bgCard]}
        className="items-center justify-center p-5"
        style={{
          borderWidth: 1,
          borderRadius: 10,
          borderColor: colors.border,
        }}>
        {icon}
        {badge && (
          <View
            className="absolute -right-1 -top-1 rounded-full px-2 py-0.5"
            style={{ backgroundColor: colors.primary }}>
            <AppText size="subtext" bold style={{ color: '#fff' }}>
              {badge}
            </AppText>
          </View>
        )}
      </LinearGradient>
      <AppText size="min" muted semibold className="mt-2 text-center">
        {label}
      </AppText>
    </TouchableOpacity>
  );
}
