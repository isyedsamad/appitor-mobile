import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { CalendarRange, ChevronRight, ClipboardCheck, Lock } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';

function getExamStatus(start: string, end: string) {
  const today = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (today < s) return 'upcoming';
  if (today >= s && today <= e) return 'active';
  return 'completed';
}

export default function StudentExamPortal() {
  const router = useRouter();
  const { schoolUser } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState('');
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    async function loadSessions() {
      try {
        const ref = doc(db, 'schools', schoolUser.schoolId, 'settings', 'academic');
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const list = snap.data().sessions;
        setSessions(list);
        setSession(schoolUser.currentSession);
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
        <View className="mx-5 mt-5 flex-row gap-2">
          <Stat label="Total Exams" value={counts.total} />
          <Stat label="Active" value={counts.active} accent="primary" />
          <Stat label="Upcoming" value={counts.upcoming} accent="warning" />
        </View>
        <View className="mt-4 px-5">
          {exams.length === 0 ? (
            <EmptyState />
          ) : (
            exams.map((exam) => {
              const declared = exam.resultDeclared === true;
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
                  disabled={!declared}
                  onPress={() =>
                    router.push({
                      pathname: '/(student)/exams/[termId]/marks',
                      params: { termId: exam.id, termName: exam.name },
                    })
                  }
                  className="mb-4 rounded-2xl border p-5"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: colors.primarySoft }}>
                        <ClipboardCheck size={20} color={colors.primary} />
                      </View>
                      <View>
                        <AppText semibold>{exam.name}</AppText>
                        <AppText size="min" muted>
                          Exam Term
                        </AppText>
                      </View>
                    </View>
                    {declared ? (
                      <ChevronRight size={20} color={colors.textMuted} />
                    ) : (
                      <Lock size={18} color={colors.textMuted} />
                    )}
                  </View>
                  <View className="mt-3 flex-row items-center gap-2">
                    <CalendarRange size={15} color={colors.textMuted} />
                    <AppText size="min" muted>
                      {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
                    </AppText>
                  </View>
                  <View className="mt-4 flex-row items-center justify-between">
                    <View
                      className="rounded-lg px-3 py-1"
                      style={{
                        backgroundColor: declared ? colors.statusPbg : colors.statusLbg,
                      }}>
                      <AppText
                        size="min"
                        semibold
                        style={{
                          color: declared ? colors.statusPtext : colors.statusLtext,
                        }}>
                        {declared ? 'Result Available' : 'Result Pending'}
                      </AppText>
                    </View>
                    <View
                      className="rounded-full px-3 py-1"
                      style={{
                        backgroundColor: statusBg,
                        borderWidth: 1,
                        borderColor: statusColor,
                      }}>
                      <AppText size="min" semibold style={{ color: statusColor }}>
                        {status.toUpperCase()}
                      </AppText>
                    </View>
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

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View
      className="items-center rounded-2xl border p-6"
      style={{
        backgroundColor: colors.bgCard,
        borderColor: colors.border,
      }}>
      <View
        className="mb-4 h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.primarySoft }}>
        <ClipboardCheck size={26} color={colors.primary} />
      </View>
      <AppText size="title" semibold className="text-center">
        No Exams Found
      </AppText>
      <AppText size="subtext" muted className="mt-2 text-center" style={{ lineHeight: 20 }}>
        Exams for this session will appear here once they are created by the school.
      </AppText>
    </View>
  );
}

function formatDate(d: any) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Stat({ label, value, accent }: any) {
  const { colors } = useTheme();
  const color =
    accent === 'primary' ? colors.primary : accent === 'warning' ? colors.statusLtext : colors.text;
  return (
    <View
      className="flex-1 rounded-xl px-4 py-3"
      style={{
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <AppText size="min" muted>
        {label}
      </AppText>
      <AppText size="title" semibold style={{ color }}>
        {value == 0 ? value : value.toString().padStart(2, '0')}
      </AppText>
    </View>
  );
}
