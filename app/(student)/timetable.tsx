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
import { CalendarDays, Clock } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

/* ---------------- constants ---------------- */

const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/* ---------------- helpers ---------------- */

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
    if (slot) rows.push({ type: 'period', slot });

    const br = settings.breaks?.find((b: any) => b.afterPeriod === p);
    if (br) rows.push({ type: 'break', ...br });
  }
  return rows;
}

/* ================= PAGE ================= */

export default function StudentTimetablePage() {
  const { schoolUser, classData, subjectData, employeeData } = useAuth();
  const { colors } = useTheme();

  const [settings, setSettings] = useState<any>(null);
  const [studentSlots, setStudentSlots] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState(new Date());
  const [weekDay, setWeekDay] = useState(DAY_CODES[new Date().getDay()]);

  const dayCode = DAY_CODES[date.getDay()];

  /* ---------------- load timetable ---------------- */

  useEffect(() => {
    async function init() {
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
          Toast.show({ type: 'error', text1: 'Timetable not found' });
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

  /* ---------------- derived ---------------- */

  const timeline = useMemo(() => (settings ? buildTimeline(settings) : {}), [settings]);

  const getDaySlots = (d: string) => {
    if (!studentSlots?.days?.[d]) return [];
    return Object.values(studentSlots.days[d]).flatMap((p: any) =>
      (p.entries || []).map((e: any) => ({
        ...e,
        period: p.period,
        day: d,
        classId: schoolUser.className,
        sectionId: schoolUser.section,
      }))
    );
  };

  const focusedRows = useMemo(() => {
    if (!settings) return [];
    const d = view === 'day' ? dayCode : weekDay;
    return buildRows(getDaySlots(d), settings);
  }, [settings, view, dayCode, weekDay, studentSlots]);

  const todaySlots = getDaySlots(dayCode);
  const nowSlot = todaySlots.find((s) =>
    isNow(timeline?.[s.period]?.start, timeline?.[s.period]?.end)
  );

  /* ---------------- ui helpers ---------------- */

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (_, d) => d && setDate(d),
      });
    }
  };

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Timetable" />
      <ScrollView>
        <View
          className="mx-6 mt-4 rounded-2xl p-6"
          style={{
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <View className="flex-row items-start justify-between">
            <View>
              <AppText size="subtext" muted>
                {date.toDateString()}
              </AppText>
              <AppText size="title" semibold>
                {dayCode}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={openDatePicker}
              className="flex-row items-center gap-2 rounded-lg px-4 py-2"
              style={{ backgroundColor: colors.primarySoft }}>
              <CalendarDays size={14} color={colors.primary} />
              <AppText semibold primary>
                Change
              </AppText>
            </TouchableOpacity>
          </View>
          <View className="mr-2 mt-4 flex-row justify-between">
            <View>
              <AppText size="subtext" muted>
                Periods Today
              </AppText>
              <AppText semibold>{todaySlots.length}</AppText>
            </View>
            <View>
              <AppText size="subtext" muted>
                Current Class
              </AppText>
              <AppText semibold>
                {nowSlot ? subjectData.find((s: any) => s.id === nowSlot.subjectId)?.name : '—'}
              </AppText>
            </View>
            <View>
              <AppText size="subtext" muted>
                Time
              </AppText>
              <View className="flex-row items-center gap-1">
                <Clock size={14} color={colors.textMuted} />
                <AppText semibold>
                  {nowSlot ? minutesToTime(timeline[nowSlot.period].start) : '--:--'}
                </AppText>
              </View>
            </View>
          </View>
        </View>
        <View
          className="mx-6 mt-4 rounded-full"
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
                    className="items-center justify-center py-2"
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
        {view === 'week' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 30 }}
            className="mt-4 px-6">
            {settings.workingDays.map((d: string) => (
              <TouchableOpacity
                key={d}
                onPress={() => setWeekDay(d)}
                className="mr-2 rounded-2xl px-4 py-2"
                style={{
                  backgroundColor: weekDay === d ? colors.primarySoft : colors.bgCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <AppText size="label" semibold primary={weekDay === d}>
                  {d}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <View className="mt-4 px-6">
          <FlatList
            data={focusedRows}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
            renderItem={({ item }) =>
              item.type === 'break' ? (
                <View
                  className="items-center rounded-xl py-3"
                  style={{
                    backgroundColor: colors.primarySoft,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}>
                  <AppText semibold primary>
                    {item.label} · {item.duration} mins
                  </AppText>
                </View>
              ) : (
                <PeriodCard slot={item.slot} timeline={timeline} />
              )
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ================= CARDS ================= */

function PeriodCard({ slot, timeline }: any) {
  const { colors } = useTheme();
  const { subjectData, employeeData } = useAuth();
  const time = timeline[slot.period];
  const today = DAY_CODES[new Date().getDay()];
  const active = slot.day === today && isNow(time.start, time.end);

  return (
    <View
      className="flex-row gap-4 rounded-2xl border p-4"
      style={{
        backgroundColor: active ? colors.primarySoft : colors.bgCard,
        borderColor: active ? colors.primary : colors.border,
      }}>
      <View
        className="h-14 w-12 items-center justify-center rounded-xl"
        style={{
          backgroundColor: active ? colors.primary : colors.primarySoft,
        }}>
        <AppText semibold style={{ color: active ? '#fff' : colors.primary }}>
          P{slot.period}
        </AppText>
      </View>

      <View className="flex-1">
        <AppText semibold>{subjectData.find((s: any) => s.id === slot.subjectId)?.name}</AppText>
        <AppText size="subtext" muted>
          {employeeData.find((t: any) => t.uid === slot.teacherId)?.name}
        </AppText>
        <AppText size="min" muted>
          {minutesToTime(time.start)} – {minutesToTime(time.end)}
        </AppText>
      </View>
    </View>
  );
}
