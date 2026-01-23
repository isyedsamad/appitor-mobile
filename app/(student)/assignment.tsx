'use client';

import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CalendarClock, CircleOff } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

function formatDueDate(ts: any) {
  if (!ts) return '-';
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(ts: any) {
  if (!ts) return false;
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return d.getTime() < Date.now();
}

export default function EmployeeAssignmentPage() {
  const { schoolUser, classData, subjectData, employeeData } = useAuth();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [sessionId, setSessionId] = useState(schoolUser?.currentSession || '');
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [assignments, setAssignments] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedClass = useMemo(
    () => classData?.find((c: any) => c.id === classId),
    [classId, classData]
  );
  const getSection = (cid: any, sid: any) =>
    classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;

  useEffect(() => {
    if (!schoolUser) return;
    async function loadSessions() {
      setLoading(true);
      try {
        setClassId(schoolUser.className);
        setSectionId(schoolUser.section);
        const ref = doc(db, 'schools', schoolUser.schoolId, 'settings', 'academic');
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        setSessionList(snap.data().sessions || []);
        searchAssignments(schoolUser.currentSession);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Assignment',
          text2: 'Error: ' + err,
        });
        setLoading(true);
      }
    }
    loadSessions();
  }, []);

  async function searchAssignments(session: any) {
    if (!session || !classId || !sectionId) {
      Toast.show({
        type: 'error',
        text1: 'Missing filters',
        text2: 'Select session, class and section',
      });
      return;
    }
    setLoading(true);
    try {
      const ref = doc(
        db,
        'schools',
        schoolUser.schoolId,
        'branches',
        schoolUser.currentBranch,
        'learning',
        'items',
        'assignments',
        `${classId}_${sectionId}_${session}`
      );
      const snap = await getDoc(ref);
      setAssignments(snap.exists() ? snap.data().items || [] : []);
    } finally {
      setLoading(false);
    }
  }

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    if (filter === 'all') return assignments;
    return assignments.filter((a) => {
      const expired = isExpired(a.dueDate);
      return filter === 'past' ? expired : !expired;
    });
  }, [assignments, filter]);

  if (loading) return <Loading />;

  return (
    <>
      <Screen scroll={false}>
        <Header title="Assignments" />
        <ScrollView>
          <View className="mt-5">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 7 }}
              data={sessionList || []}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => {
                const active = sessionId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSessionId(item.id);
                      setAssignments(null);
                      searchAssignments(item.id);
                    }}
                    className="rounded-full border px-4 py-2"
                    style={{
                      backgroundColor: active ? colors.primarySoft : colors.bgCard,
                      borderColor: active ? colors.primary : colors.border,
                    }}>
                    <AppText
                      size="label"
                      semibold
                      style={{ color: active ? colors.primary : colors.textMuted }}>
                      {item.id}
                    </AppText>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <View
            className="mx-5 mt-4 flex-row rounded-2xl border p-1"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bgCard,
            }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past' },
            ].map((t) => {
              const active = filter === t.key;

              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setFilter(t.key as any)}
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
                    {t.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <FlatList
            data={filteredAssignments}
            scrollEnabled={false}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            ListEmptyComponent={
              assignments && (
                <View className="items-center px-10 py-12">
                  <CircleOff size={32} color={colors.primary} />
                  <AppText semibold className="mt-5">
                    No Assignment found!
                  </AppText>
                  <AppText size="subtext" muted semibold className="text-center">
                    No assignment found for the selected filter.
                  </AppText>
                </View>
              )
            }
            renderItem={({ item }) => {
              const expired = isExpired(item.dueDate);
              const isOwner = item.createdBy === schoolUser.uid;
              return (
                <View
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  }}>
                  <View
                    className="flex-row items-start justify-between px-5 py-4"
                    style={{
                      backgroundColor: colors.bg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}>
                    <View className="flex-1 pr-3">
                      <AppText size="body" semibold>
                        {item.title}
                      </AppText>
                      <AppText size="subtext" muted className="mt-0.5">
                        {subjectData.find((s: any) => s.id === item.subjectId)?.name}
                      </AppText>
                    </View>
                    <View
                      className="rounded-full border px-3 py-1"
                      style={{
                        backgroundColor: expired ? colors.statusAbg : colors.statusPbg,
                        borderColor: expired ? colors.statusAborder : colors.statusPborder,
                      }}>
                      <AppText
                        size="min"
                        semibold
                        style={{
                          color: expired ? colors.statusAtext : colors.statusPtext,
                        }}>
                        {expired ? 'Past' : 'Upcoming'}
                      </AppText>
                    </View>
                  </View>
                  <View className="gap-3 px-5 py-4">
                    <View className="flex-row items-center gap-2">
                      <CalendarClock size={14} color={colors.textMuted} />
                      <AppText size="subtext" muted semibold>
                        Due {formatDueDate(item.dueDate)}
                      </AppText>
                    </View>
                    {item.description ? (
                      <AppText size="label" style={{ lineHeight: 18 }}>
                        {item.description}
                      </AppText>
                    ) : (
                      <AppText size="subtext" muted>
                        No description provided
                      </AppText>
                    )}
                  </View>
                  <View
                    className="flex-row items-center justify-between px-6 py-3"
                    style={{
                      borderTopWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                    }}>
                    <View
                      className="rounded-lg px-3 py-1"
                      style={{
                        backgroundColor: colors.bgCard,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <AppText size="subtext" muted semibold>
                        {capitalizeWords(
                          employeeData.find((t: any) => t.uid === item.createdBy)?.name || ''
                        )}
                      </AppText>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </ScrollView>
      </Screen>
    </>
  );
}
