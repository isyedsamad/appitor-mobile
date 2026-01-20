import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CalendarDays } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const STATUS_FILTERS = ['all', 'ongoing', 'upcoming', 'past'];

export function formatDate(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

export default function HolidayPage() {
  const { schoolUser } = useAuth();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState('');
  const [holidays, setHolidays] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const ref = doc(db, 'schools', schoolUser.schoolId, 'settings', 'academic');
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        setSessions(snap.data().sessions || []);
        setSession(snap.data().currentSession);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Sessions',
          text2: 'Error: ' + err,
        });
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!session) return;
    async function fetchHolidays() {
      setLoading(true);
      try {
        const ref = doc(
          db,
          'schools',
          schoolUser.schoolId,
          'branches',
          schoolUser.currentBranch,
          'holidays',
          session
        );

        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setHolidays([]);
          return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const rows = (snap.data().items || []).map((h: any) => {
          const from = new Date(h.from);
          from.setHours(0, 0, 0, 0);
          const to = h.to ? new Date(h.to) : new Date(h.from);
          to.setHours(23, 59, 59, 999);
          let status = 'upcoming';
          if (today > to) status = 'past';
          else if (today >= from && today <= to) status = 'ongoing';

          return { ...h, status };
        });

        rows.sort((a: any, b: any) => new Date(a.from).getTime() - new Date(b.from).getTime());
        setHolidays(rows);
      } finally {
        setLoading(false);
      }
    }

    fetchHolidays();
  }, [session]);

  const filtered = useMemo(() => {
    if (filter === 'all') return holidays;
    return holidays.filter((h) => h.status === filter);
  }, [holidays, filter]);

  const todayHoliday = holidays.find((h) => h.status === 'ongoing');
  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Holidays" />
      <ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-6 px-5"
          contentContainerStyle={{ paddingRight: 30 }}>
          {sessions.map((s) => {
            const active = s.id === session;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSession(s.id)}
                className="mr-2 rounded-full px-5 py-2"
                style={{
                  backgroundColor: active ? colors.primarySoft : colors.bgCard,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}>
                <AppText size="label" semibold primary={active}>
                  {s.id}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {todayHoliday && (
          <View
            className="mx-5 mt-5 flex-row items-center gap-4 rounded-2xl px-5 py-4"
            style={{
              backgroundColor: colors.statusPbg,
              borderColor: colors.statusPborder,
              borderWidth: 1,
            }}>
            <CalendarDays size={22} color={colors.statusPtext} />
            <View>
              <AppText semibold style={{ color: colors.statusPtext }}>
                Today is a Holiday 🎉
              </AppText>
              <AppText size="min" semibold style={{ color: colors.statusPtext }}>
                {todayHoliday.title}
              </AppText>
            </View>
          </View>
        )}
        <View className="mt-5 flex-row gap-2 px-5">
          {STATUS_FILTERS.map((f) => {
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: active ? colors.primarySoft : colors.bgCard,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}>
                <AppText size="subtext" semibold primary={active}>
                  {f.toUpperCase()}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="mt-4 px-5">
          {filtered.length === 0 ? (
            <View className="items-center py-20">
              <AppText muted>No holidays found</AppText>
            </View>
          ) : (
            filtered.map((h) => <HolidayCard key={h.id} holiday={h} />)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function HolidayCard({ holiday }: any) {
  const { colors } = useTheme();
  const STATUS_UI = {
    ongoing: {
      bg: colors.statusPbg,
      text: colors.statusPtext,
      border: colors.statusPborder,
      label: 'ONGOING',
    },
    upcoming: {
      bg: colors.primarySoft,
      text: colors.primary,
      border: colors.primary,
      label: 'UPCOMING',
    },
    past: {
      bg: colors.bg,
      text: colors.textMuted,
      border: colors.border,
      label: 'PAST',
    },
  };
  const ui = STATUS_UI[holiday.status as keyof typeof STATUS_UI];
  const visibleDays = holiday.daysList.slice(0, 3);
  const remaining = holiday.daysList.length - visibleDays.length;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' });

  return (
    <View
      className="mb-3 rounded-2xl p-5"
      style={{
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: ui.label == 'ONGOING' ? colors.statusPborder : colors.border,
      }}>
      <View className="flex-row items-center justify-between">
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: ui.bg, borderWidth: 1, borderColor: ui.border }}>
          <AppText size="min" semibold style={{ color: ui.text }}>
            {ui.label}
          </AppText>
        </View>
        <View
          className="rounded-lg px-3 py-1"
          style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
          <AppText size="min" muted semibold>
            {holiday.days} day(s)
          </AppText>
        </View>
      </View>
      <AppText size="title" semibold className="mt-2">
        {holiday.title}
      </AppText>
      <AppText size="min" muted semibold>
        {formatDate(holiday.from)}
        {holiday.to ? ` → ${formatDate(holiday.to)}` : ''}
      </AppText>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {visibleDays.map((d: string, i: number) => {
          const isToday = d === today;
          return (
            <View
              key={i}
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: colors.bg,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <AppText size="min" semibold>
                {d}
              </AppText>
            </View>
          );
        })}
        {remaining > 0 && (
          <View
            className="rounded-full px-3 py-1"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <AppText size="min" muted>
              +{remaining} more
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}
