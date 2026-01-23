import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Calendar } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const buildTimeline = (settings: any) => {
  let cursor = timeToMinutes(settings.startTime);
  const map: any = {};
  const breaks = settings.breaks || [];
  for (let p = 1; p <= settings.totalPeriods; p++) {
    const start = cursor;
    cursor += settings.periodDuration;
    map[p] = { start, end: cursor };
    const br = breaks.find((b: any) => b.afterPeriod === p);
    if (br) cursor += br.duration;
  }
  return map;
};

const isNow = (start: number, end: number) => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= start && mins <= end;
};

function buildRows(slots: any[], settings: any) {
  const rows: any[] = [];
  for (let p = 1; p <= settings.totalPeriods; p++) {
    const slot = slots.find((s) => s.period === p);
    if (slot) {
      rows.push({ type: 'period', slot });
    }
    const br = settings.breaks?.find((b: any) => b.afterPeriod === p);
    if (br) {
      rows.push({ type: 'break', ...br });
    }
  }
  return rows;
}

export default function EmployeeTimetablePage() {
  const { schoolUser, classData, subjectData, employeeData } = useAuth();
  const { colors } = useTheme();
  const [settings, setSettings] = useState<any>(null);
  const [studentSlots, setStudentSlots] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState(new Date());
  const dayCode = DAY_CODES[date.getDay()];
  const getTeacherName = (id: any) => employeeData.find((t: any) => t.id === id)?.name;
  const getSubjectName = (id: any) => subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) =>
    classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;

  useEffect(() => {
    if (!schoolUser) return;
    async function init() {
      setLoading(true);
      try {
        const ref = doc(
          db,
          'schools',
          schoolUser.schoolId,
          'branches',
          schoolUser.currentBranch,
          'timetable',
          'items',
          'timetableSettings',
          'global'
        );
        const snap = await getDoc(ref);
        if (!snap.exists() || snap.data().status !== 'active') {
          Toast.show({ type: 'info', text1: 'Timetable not active' });
          router.back();
          return;
        }
        setSettings(snap.data());
        const refClass = doc(
          db,
          'schools',
          schoolUser.schoolId,
          'branches',
          schoolUser.currentBranch,
          'timetable',
          'items',
          'classes',
          `${schoolUser.className}_${schoolUser.section}`
        );
        const snapClass = await getDoc(refClass);
        if (!snapClass.exists()) {
          Toast.show({
            type: 'error',
            text1: 'Timetable not Found',
            text2: 'Once it’s added, you’ll see all your classes.',
          });
          router.back();
          return;
        }
        setStudentSlots(snapClass.data());
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const timeline = useMemo(() => (settings ? buildTimeline(settings) : {}), [settings]);
  const myDay = useMemo(() => {
    if (!studentSlots || !studentSlots.days || !dayCode) return [];
    const dayObj = studentSlots.days[dayCode] || [];
    return Object.values(dayObj).flatMap((periodObj: any) =>
      (periodObj.entries || []).map((entry: any) => ({
        ...entry,
        period: periodObj.period,
        classId: schoolUser?.className,
        sectionId: schoolUser?.section,
      }))
    );
  }, [studentSlots, dayCode, schoolUser]);

  const myDayRows = useMemo(() => (settings ? buildRows(myDay, settings) : []), [myDay, settings]);

  const myWeek = useMemo(
    () =>
      settings?.workingDays.map((d: string) => ({
        day: d,
        slots: (studentSlots?.days?.[d]
          ? Object.values(studentSlots.days[d] as any)
              .flatMap((periodObj: any) =>
                (periodObj.entries || []).map((entry: any) => ({
                  ...entry,
                  period: periodObj.period,
                  day: d,
                  classId: schoolUser?.className,
                  sectionId: schoolUser?.section,
                }))
              )
              .sort((a, b) => a.period - b.period)
          : []) as any[],
      })) || [],
    [settings, studentSlots]
  );

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (_, d) => d && setDate(d),
      });
    }
  };

  const listData = view === 'day' ? myDayRows : myWeek;

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Timetable" />
      <ScrollView>
        {view != 'week' && (
          <View className="mx-7 mt-5">
            <AppText size="label" muted>
              Date
            </AppText>
            <TouchableOpacity
              onPress={openDatePicker}
              className="mt-1 flex-row justify-between rounded-xl border px-4 py-3"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
              <AppText>{date.toDateString()}</AppText>
              <Calendar size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        <View
          className="mx-7 mt-3 rounded-full"
          style={{
            backgroundColor: colors.bgCard,
            padding: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <View className="flex-row gap-2">
            {['day', 'week'].map((v) => {
              const isActive = view === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => setView(v as any)}
                  activeOpacity={0.9}
                  className="flex-1 rounded-full"
                  style={{
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}>
                  <View
                    className="items-center justify-center py-3"
                    style={{
                      borderRadius: 999,
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      shadowColor: isActive ? colors.primary : 'transparent',
                      shadowOpacity: isActive ? 0.18 : 0,
                      shadowRadius: isActive ? 6 : 0,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: isActive ? 2 : 0,
                    }}>
                    <AppText
                      size="label"
                      semibold
                      alwaysWhite={isActive}
                      style={{
                        letterSpacing: 0.5,
                        color: isActive ? '#fff' : (colors.textMuted ?? colors.text),
                        textTransform: 'uppercase',
                      }}>
                      {v}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View className="mt-4 flex-1 px-5">
          <FlatList
            data={listData}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 30 }}
            renderItem={({ item }) => {
              if (!listData || (listData.length === 1 && item?.type == 'break')) return null;
              if (item?.type === 'break') {
                return <BreakRow breakItem={item} />;
              }
              if (view === 'week') {
                return (
                  <View className="mt-1 gap-3">
                    <View
                      className="items-center justify-center rounded-xl px-4 py-2"
                      style={{
                        backgroundColor: colors.primarySoft,
                        borderWidth: 1,
                        borderColor: colors.primary,
                      }}>
                      <AppText semibold primary>
                        {item.day}
                      </AppText>
                    </View>
                    {item.slots.map((s: any) => (
                      <PeriodCard key={s.period} slot={s} timeline={timeline} />
                    ))}
                  </View>
                );
              }
              return <PeriodCard slot={item.slot ?? item} timeline={timeline} />;
            }}
            ListEmptyComponent={
              <View className="items-center py-20">
                <AppText muted>No timetable found</AppText>
              </View>
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function PeriodCard({ slot, timeline }: any) {
  const { colors } = useTheme();
  const { classData, employeeData, subjectData } = useAuth();
  const time = timeline[slot.period];
  const dayCode = DAY_CODES[new Date().getDay()];
  const active = slot.day == dayCode && isNow(time.start, time.end);
  const getTeacherName = (id: any) => employeeData.find((t: any) => t.uid === id)?.name;
  const getSubjectName = (id: any) => subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) =>
    classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;
  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };
  return (
    <View
      className="flex-row items-start gap-4 rounded-2xl border p-4"
      style={{
        backgroundColor: active ? colors.primarySoft : colors.bgCard,
        borderColor: active ? colors.primary : colors.border,
      }}>
      <View
        className="h-14 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: active ? colors.primary : colors.primarySoft }}>
        <AppText semibold style={{ color: active ? '#fff' : colors.primary }}>
          P{slot.period}
        </AppText>
      </View>
      <View className="flex-1">
        <AppText size="body" semibold>
          {getClassName(slot.classId)} {getSection(slot.classId, slot.sectionId)} -{' '}
          {getSubjectName(slot.subjectId)}
        </AppText>
        <AppText size="subtext" muted semibold>
          {capitalizeWords(getTeacherName(slot.teacherId))}
        </AppText>
        <AppText size="min" muted semibold>
          {minutesToTime(time.start)} – {minutesToTime(time.end)}
        </AppText>
      </View>
    </View>
  );
}

function BreakRow({ breakItem }: any) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-center justify-center gap-4 rounded-2xl px-4 py-4"
      style={{ backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }}>
      <AppText size="label" muted semibold primary>
        {breakItem.label} - {breakItem.duration} mins
      </AppText>
    </View>
  );
}
