import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import secureAxios from '@/lib/secureAxios';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Bell, CircleOff, User } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, TouchableOpacity, View } from 'react-native';

function formatDate(ts: any): string {
  if (!ts) return '';
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return d
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
    .replace(/-/g, ' ');
}

const readFields: Record<string, string> = {
  notice: 'notificationRead.notificationLastReadAt',
  personal: 'notificationRead.personalMessageLastReadAt',
};

export default function NotificationPage() {
  const { schoolUser, setNotificationBadge } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const initialTab = (params?.tab as any) || 'notice';
  const [tab, setTab] = useState<'notice' | 'personal'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const read = schoolUser?.notificationRead || {};

  useEffect(() => {
    if (!schoolUser) return;
    async function loadAll() {
      setLoading(true);
      try {
        const base = doc(db, 'schools', schoolUser.schoolId, 'branches', schoolUser.currentBranch);
        const [nSnap, mSnap] = await Promise.all([
          getDoc(doc(base, 'communication', 'items', 'notices', schoolUser.currentSession)),
          getDoc(
            doc(
              base,
              'communication',
              'items',
              'employee_messages',
              `${schoolUser.uid}_${schoolUser.currentSession}`
            )
          ),
        ]);
        setNotices(sortByNewest(nSnap.exists() ? nSnap.data().items || [] : []));
        setMessages(sortByNewest(mSnap.exists() ? mSnap.data().items || [] : []));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (!schoolUser || loading) return;
    const field = readFields[tab];
    if (!field) return;
    const ref = doc(db, 'schoolUsers', schoolUser.uid);
    updateDoc(ref, {
      [field]: serverTimestamp(),
    });
  }, [tab, loading]);

  useEffect(() => {
    if (!schoolUser) return;
    clearBadgeForTab(tab);
  }, []);

  function handleTabChange(nextTab: 'notice' | 'personal') {
    setTab(nextTab);
    clearBadgeForTab(nextTab);
  }

  function clearBadgeForTab(tab: 'notice' | 'personal') {
    setNotificationBadge((prev: any) => ({
      ...prev,
      noticeboard: tab === 'notice' ? false : prev.noticeboard,
      personalMessage: tab === 'personal' ? false : prev.personalMessage,
    }));
  }

  const data = useMemo(() => {
    if (tab === 'notice') return notices;
    return messages;
  }, [tab, notices, messages]);

  const unreadCount = useMemo(() => {
    const read = schoolUser.notificationRead || {};
    function count(items: any[], lastRead?: any) {
      if (!items?.length) return 0;
      const lastReadMs = lastRead?.toMillis?.() || 0;
      return items.filter((i) => (i.createdAt?.toMillis?.() || 0) > lastReadMs).length;
    }
    return {
      notice: count(notices, read.notificationLastReadAt),
      personal: count(messages, read.personalMessageLastReadAt),
    };
  }, [notices, messages, schoolUser]);

  useEffect(() => {
    if (!schoolUser) return;
    if (tab !== 'personal') return;
    if (!messages.some((m) => !m.readAt)) return;
    secureAxios.patch('/api/school/communication/employee-message', {
      schoolId: schoolUser.schoolId,
      branch: schoolUser.currentBranch,
      employeeUid: schoolUser.uid,
      sessionId: schoolUser.currentSession,
    });
  }, [tab]);

  function sortByNewest(items: any[]) {
    return [...items].sort(
      (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    );
  }

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Notifications" />
      <ScrollView>
        <View className="mx-5 mb-5 mt-6">
          <AppText size="body" semibold className="text-center">
            {tab === 'notice' ? 'Noticeboard' : 'Employee Inbox'}
          </AppText>
          <AppText size="subtext" muted className="text-center">
            {tab === 'notice' ? 'School-wide announcements' : 'Direct messages sent to you'}
          </AppText>
        </View>
        <View
          className="mx-5 flex-row rounded-2xl border p-1"
          style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
          <FilterTab
            label="Notice"
            active={tab === 'notice'}
            count={unreadCount.notice}
            onPress={() => handleTabChange('notice')}
          />
          <FilterTab
            label="Personal"
            active={tab === 'personal'}
            count={unreadCount.personal}
            onPress={() => handleTabChange('personal')}
          />
        </View>
        <View className="mx-1">
          <FlatList
            data={data}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            ListEmptyComponent={
              <View className="items-center px-10 py-12">
                <CircleOff size={32} color={colors.primary} />
                <AppText semibold className="mt-4">
                  No notifications found!
                </AppText>
                <AppText size="subtext" muted className="text-center">
                  You are all caught up
                </AppText>
              </View>
            }
            renderItem={({ item }) => {
              const createdAtMs = item.createdAt?.toMillis?.() || 0;
              let lastReadMs = 0;
              if (tab === 'notice') {
                lastReadMs = read.notificationLastReadAt?.toMillis?.() || 0;
              }
              if (tab === 'personal') {
                lastReadMs = read.personalMessageLastReadAt?.toMillis?.() || 0;
              }
              const unread = createdAtMs > lastReadMs;
              return (
                <View
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: unread ? colors.primary : colors.border,
                    borderLeftWidth: unread ? 3 : 1,
                  }}>
                  <View
                    className="flex-row items-center justify-between gap-2 px-5 py-4"
                    style={{
                      backgroundColor: colors.bg,
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    }}>
                    <View className="flex-1 flex-row items-center">
                      <View
                        className="mr-3 rounded-xl border p-2"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: colors.bgCard,
                        }}>
                        {tab === 'notice' && <Bell size={16} color={colors.primary} />}
                        {tab === 'personal' && <User size={16} color={colors.primary} />}
                      </View>
                      <View className="flex-1">
                        <AppText semibold>{item.title}</AppText>
                        <AppText size="subtext" muted>
                          {formatDate(item.createdAt)}
                        </AppText>
                      </View>
                    </View>
                    {item.priority == 'important' && <PriorityChip priority={item.priority} />}
                  </View>
                  <View className="px-5 py-4">
                    <AppText size="label" style={{ lineHeight: 18 }}>
                      {item.description || item.body}
                    </AppText>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function PriorityChip({ priority }: { priority?: string }) {
  const { colors } = useTheme();
  const important = priority === 'important';
  return (
    <View
      className="rounded-full border px-3 py-1"
      style={{
        backgroundColor: important ? colors.statusAbg : colors.bgCard,
        borderColor: important ? colors.statusAborder : colors.border,
      }}>
      <AppText
        size="min"
        semibold
        style={{
          color: important ? colors.statusAtext : colors.textMuted,
        }}>
        {important ? 'Important' : 'Normal'}
      </AppText>
    </View>
  );
}

function FilterTab({ label, active, count, onPress }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center rounded-xl py-3"
      style={{ backgroundColor: active ? colors.primarySoft : 'transparent' }}>
      <View className="flex-row items-center gap-2">
        <AppText
          size="label"
          semibold
          style={{ color: active ? colors.primary : colors.textMuted }}>
          {label}
        </AppText>
        {count > 0 && (
          <View
            className="min-w-[18px] items-center rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: colors.primary }}>
            <AppText size="min" semibold style={{ color: '#fff' }}>
              {count}
            </AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
