import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { Blocks, CalendarRange, ClipboardList } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

function getExamStatus(start: string, end: string) {
  const today = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (today < s) return 'upcoming';
  if (today >= s && today <= e) return 'active';
  return 'completed';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function EmployeeExamsPage() {
  const { schoolUser } = useAuth();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        setSessions(schoolUser.sessions || []);
        setSession(schoolUser.currentSession);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load sessions',
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
    async function loadExams() {
      setLoading(true);
      try {
        const q = query(
          collection(
            db,
            'schools',
            schoolUser.schoolId,
            'branches',
            schoolUser.currentBranch,
            'exams',
            'items',
            'exam_terms'
          ),
          where('session', '==', session),
          orderBy('startDate', 'asc')
        );
        const snap = await getDocs(q);
        setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load exams',
          text2: String(err),
        });
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, [session]);

  const counts = useMemo(() => {
    return {
      total: exams.length,
      active: exams.filter((e) => getExamStatus(e.startDate, e.endDate) === 'active').length,
      upcoming: exams.filter((e) => getExamStatus(e.startDate, e.endDate) === 'upcoming').length,
    };
  }, [exams]);

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Exams" />
      <ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-5 px-5"
          contentContainerStyle={{ paddingRight: 30 }}>
          {sessions.map((s: any) => {
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
        <View className="mx-5 mt-4 flex-row gap-2">
          <Stat label="Total Exams" value={counts.total} bg={colors.statusLbg} text={colors.statusLtext} border={colors.statusLborder} />
          <Stat label="Active" value={counts.active} accent="primary" bg={colors.statusPbg} text={colors.statusPtext} border={colors.statusPborder} />
          <Stat label="Upcoming" value={counts.upcoming} accent="warning" bg={colors.statusAbg} text={colors.statusAtext} border={colors.statusAborder} />
        </View>
        <View className="mt-3 px-5">
          {exams.length === 0 ? (
            <View className="items-center py-12 rounded-xl"
              style={{
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Blocks size={32} color={colors.statusAtext} />
              <AppText bold muted className="mt-3">
                No exams found!
              </AppText>
              <AppText size="subtext" muted>
                Try searching for different session!
              </AppText>
            </View>
          ) : (
            exams.map((exam) => {
              const status = getExamStatus(exam.startDate, exam.endDate);
              const statusColor =
                status === 'active'
                  ? colors.primary
                  : status === 'upcoming'
                    ? colors.statusLtext
                    : colors.textMuted;
              const statusBg =
                status === 'active'
                  ? colors.primarySoft
                  : status === 'upcoming'
                    ? colors.statusLbg
                    : colors.bg;

              return (
                <TouchableOpacity
                  key={exam.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(employee)/exams/[termId]/marks',
                      params: { termId: exam.id },
                    })
                  }
                  className="mb-4 rounded-2xl p-5"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  activeOpacity={0.85}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <AppText size="title" semibold>
                        {exam.name}
                      </AppText>
                      <AppText size="subtext" muted>
                        Exam Term
                      </AppText>
                    </View>
                    <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusBg }}>
                      <AppText size="min" semibold style={{ color: statusColor }}>
                        {status.toUpperCase()}
                      </AppText>
                    </View>
                  </View>
                  <View className="mt-3 flex-row items-center gap-2">
                    <CalendarRange size={16} color={colors.textMuted} />
                    <AppText size="min" muted semibold>
                      {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
                    </AppText>
                  </View>

                  <View
                    className="mt-4 flex-row items-center gap-2 border-t pt-3"
                    style={{ borderColor: colors.border }}>
                    <ClipboardList size={14} color={colors.primary} />
                    <AppText size="label" semibold primary>
                      Enter / View Marks
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, accent, bg, text, border }: any) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[bg, bg + '22']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 px-4 py-3"
      style={{
        borderRadius: 10,
        borderWidth: 1,
        borderColor: border,
      }}>
      <AppText semibold size="min" muted>
        {label}
      </AppText>
      <AppText size="title" semibold style={{ color: text }}>
        {value == 0 ? value : value.toString().padStart(2, '0')}
      </AppText>
    </LinearGradient>
  );
}
