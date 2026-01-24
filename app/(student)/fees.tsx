'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { Download, History, LineSquiggle, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { feeReceiptHTML } from '@/lib/pdf/feeReceiptTemplate';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const formatMonthLabel = (key: string) => {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

function getAcademicMonths(session: string) {
  const [startYear] = session.split('-').map(Number);
  return ['04', '05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03'].map((m) => {
    const year = Number(m) >= 4 ? startYear : startYear + 1;
    return `${year}-${m}`;
  });
}

export default function StudentFeePortal() {
  const { schoolUser, classData } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<string[]>([]);
  const [session, setSession] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feeTemplate, setFeeTemplate] = useState<any>(null);
  const [filter, setFilter] = useState<'month' | 'history'>('month');
  const [lastSessionPayment, setLastSessionPayment] = useState('');
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) =>
    classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;

  useEffect(() => {
    if (!session) return;
    setFilter('month');
    async function loadFeeTemplate() {
      try {
        const q = query(
          collection(
            db,
            'schools',
            schoolUser.schoolId,
            'branches',
            schoolUser.currentBranch,
            'fees',
            'templates',
            'items'
          ),
          where('academicYear', '==', session),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFeeTemplate(snap.docs[0].data());
        }
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load fee template',
        });
      }
    }
    loadFeeTemplate();
  }, [session]);

  useEffect(() => {
    async function loadSessions() {
      try {
        const ref = doc(db, 'schools', schoolUser.schoolId, 'settings', 'academic');
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        setSessions(data.sessions || []);
        setSession(data.currentSession);
      } catch (e: any) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load sessions',
        });
      }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!session) return;
    loadFeeData(true);
  }, [session]);

  async function loadFeeData(reset = false) {
    setLoading(true);
    try {
      const summaryRef = doc(
        db,
        'schools',
        schoolUser.schoolId,
        'branches',
        schoolUser.currentBranch,
        'fees',
        'session_summaries',
        'items',
        `${schoolUser.uid}_${session}`
      );
      const summarySnap = await getDoc(summaryRef);
      setSummary(summarySnap.exists() ? summarySnap.data() : null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (filter == 'history') loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    if (payments.length > 0 && lastSessionPayment == session) return;
    setLoading(true);
    try {
      const payQ = query(
        collection(
          db,
          'schools',
          schoolUser.schoolId,
          'branches',
          schoolUser.currentBranch,
          'fees',
          'payments',
          'items'
        ),
        where('studentId', '==', schoolUser.uid),
        where('sessionId', '==', session),
        orderBy('createdAt', 'desc'),
        limit(4)
      );
      const snap = await getDocs(payQ);
      setLastSessionPayment(session);
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Payment History',
        text2: 'Error: ' + error,
      });
    } finally {
      setLoading(false);
    }
  };

  async function loadMorePayments() {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(
          db,
          'schools',
          schoolUser.schoolId,
          'branches',
          schoolUser.currentBranch,
          'fees',
          'payments',
          'items'
        ),
        where('studentId', '==', schoolUser.uid),
        where('sessionId', '==', session),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(2)
      );
      const snap = await getDocs(q);
      setPayments((p) => [...p, ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
    } finally {
      setLoadingMore(false);
    }
  }

  const monthList = React.useMemo(() => {
    if (!summary || !session) return [];
    const academicMonths = getAcademicMonths(session);
    const templateHeads = buildTemplateSnapshot(feeTemplate);
    const templateTotal = getTemplateMonthlyTotal(feeTemplate);
    return academicMonths.map((monthKey) => {
      const existing = summary.months?.[monthKey];
      if (existing) {
        return {
          month: monthKey,
          ...existing,
          status: existing.status || (existing.paid >= existing.total ? 'paid' : 'pending'),
        };
      }
      return {
        month: monthKey,
        status: 'pending',
        total: templateTotal,
        paid: 0,
        headsSnapshot: templateHeads,
        remark: 'Not paid yet',
      };
    });
  }, [summary, session, feeTemplate]);

  const totalAcademicFee = React.useMemo(() => {
    return monthList.reduce((sum, month) => sum + (month.total || 0), 0);
  }, [monthList]);

  function buildTemplateSnapshot(template: any) {
    if (!template?.items) return [];
    return template.items
      .filter((i: any) => i.frequency === 'monthly')
      .map((i: any) => ({
        headId: i.headId,
        headName: i.headName,
        amount: i.amount,
      }));
  }

  function getTemplateMonthlyTotal(template: any) {
    return (
      template?.items
        ?.filter((i: any) => i.frequency === 'monthly')
        .reduce((sum: number, i: any) => sum + i.amount, 0) || 0
    );
  }

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  async function downloadReceipt(payment: any) {
    const months: string[] = payment.items?.map((i: any) => i.label || i.period) || [];
    const headMap: Record<string, { amount: number; months: Set<string> }> = {};
    payment.items?.forEach((item: any) => {
      const monthLabel = item.label || item.period;
      item.headsSnapshot?.forEach((h: any) => {
        if (!headMap[h.headName]) {
          headMap[h.headName] = {
            amount: 0,
            months: new Set(),
          };
        }
        headMap[h.headName].amount += Number(h.amount || 0);
        headMap[h.headName].months.add(monthLabel);
      });
    });

    const heads = Object.entries(headMap).map(([name, data]) => ({
      name,
      amount: data.amount,
      months: Array.from(data.months),
    }));

    const discount = payment.discount
      ? {
          type: payment.discount.type,
          value: payment.discount.value,
          amount: payment.discount.amount,
        }
      : null;
    const html = feeReceiptHTML({
      schoolName: schoolUser.schoolName,
      schoolAddress: schoolUser.schoolAddress,
      studentName: `${schoolUser.appId} - ${capitalizeWords(schoolUser.name)}`,
      className: `${getClassName(schoolUser.className)} ${getSection(
        schoolUser.className,
        schoolUser.section
      )}`,
      session: schoolUser.currentSession,
      receiptNo: payment.receiptNo,
      date: new Date(payment.createdAt.seconds * 1000).toDateString(),
      paymentMode: payment.paymentMode,
      months,
      heads,
      discount,
      paidAmount: payment.paidAmount,
      collectedBy: payment.collectedBy?.name || 'System',
      remark: payment.remark,
    });
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Download Fee Receipt',
    });
  }

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Fees & Payments" />
      <ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-5 px-5"
          contentContainerStyle={{ paddingRight: 30 }}>
          {sessions.map((s: any) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSession(s.id)}
              className="mr-2 rounded-full px-4 py-1.5"
              style={{
                backgroundColor: s.id === session ? colors.primarySoft : colors.bgCard,
                borderWidth: 1,
                borderColor: s.id === session ? colors.primary : colors.border,
              }}>
              <AppText size="label" semibold primary={s.id === session}>
                {s.id}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {summary && (
            <View
              className="mx-5 mt-5 rounded-2xl px-6 py-4"
              style={{
                backgroundColor: colors.primary,
              }}>
              <AppText alwaysWhite size="label">
                Session Overview
              </AppText>
              <View className="mr-2 mt-3 flex-row justify-between">
                <HeroMetric label="Total Fee" value={`₹ ${totalAcademicFee}`} />
                <HeroMetric label="Paid" value={`₹ ${summary.totals.totalPaid}`} />
                <HeroMetric label="Due" value={`₹ ${summary.totals.totalDue}`} danger />
              </View>
              <View className="mt-2 flex-row items-center gap-2">
                <TrendingUp size={16} color="#fff" />
                <AppText alwaysWhite size="min">
                  Payment status updated till last transaction
                </AppText>
              </View>
            </View>
          )}
          <View
            className="mx-5 mt-4 flex-row rounded-2xl border p-1"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bgCard,
            }}>
            {[
              { key: 'month', label: 'Month-wise' },
              { key: 'history', label: 'Payment History' },
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
          {filter == 'month' && summary?.months && (
            <View className="mx-6 mt-5">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.primarySoft }}>
                  <LineSquiggle size={20} color={colors.primary} />
                </View>
                <View>
                  <AppText semibold>Month-wise Fee Details</AppText>
                  <AppText size="min" muted>
                    Breakdown of monthly charges
                  </AppText>
                </View>
              </View>
              <View className="mt-4 gap-3">
                {monthList.map((data) => {
                  const due = data.total - data.paid;
                  const isPaid = data.status === 'paid';
                  const isPending = data.status == 'pending';
                  return (
                    <View
                      key={data.month}
                      className="rounded-2xl px-5 py-4"
                      style={{
                        backgroundColor: colors.bgCard,
                        borderWidth: 1,
                        borderColor: isPaid
                          ? colors.statusPborder
                          : isPending
                            ? colors.border
                            : colors.statusAborder,
                      }}>
                      <View className="flex-row items-start justify-between">
                        <View>
                          <AppText semibold>{formatMonthLabel(data.month)}</AppText>
                          <AppText size="min" muted>
                            Monthly fee summary
                          </AppText>
                        </View>
                        <View
                          className="rounded-full px-3 py-1"
                          style={{
                            backgroundColor: isPaid
                              ? colors.statusPbg
                              : isPending
                                ? colors.statusLbg
                                : colors.statusAbg,
                            borderWidth: 1,
                            borderColor: isPaid
                              ? colors.statusPborder
                              : isPending
                                ? colors.statusLtext
                                : colors.statusAtext,
                          }}>
                          <AppText
                            size="min"
                            semibold
                            style={{
                              color: isPaid
                                ? colors.statusPtext
                                : isPending
                                  ? colors.statusLtext
                                  : colors.statusAtext,
                            }}>
                            {isPaid ? 'PAID' : isPending ? 'PENDING' : 'DUE'}
                          </AppText>
                        </View>
                      </View>
                      <>
                        <View className="mt-3 flex-row justify-between gap-2">
                          <AmountPill
                            label="Total"
                            value={data.total}
                            color={colors.text}
                            bgColor={colors.bg}
                          />
                          <AmountPill
                            label="Paid"
                            value={data.paid}
                            color={colors.statusPtext}
                            bgColor={colors.statusPbg}
                          />
                          <AmountPill
                            label="Due"
                            value={due}
                            color={colors.statusAtext}
                            bgColor={colors.statusAbg}
                          />
                        </View>
                        <View
                          className="mt-3 rounded-lg px-3 py-2"
                          style={{ backgroundColor: colors.bg }}>
                          <AppText size="label" semibold>
                            Fee Components
                          </AppText>
                          <View className="mt-2 gap-1">
                            {data.headsSnapshot.map((h: any, i: number) => (
                              <View key={i} className="flex-row items-center justify-between">
                                <AppText size="min" muted>
                                  {h.headName}
                                </AppText>
                                <AppText size="subtext" semibold>
                                  ₹{h.amount}
                                </AppText>
                              </View>
                            ))}
                          </View>
                        </View>
                      </>
                      {!isPending && (data.lastPaidAt || data.collectedBy || data.remark) && (
                        <View className="mt-2 border-t pt-3" style={{ borderColor: colors.border }}>
                          {data.lastPaidAt && (
                            <AppText size="min" muted>
                              Paid on:{' '}
                              <AppText size="min" semibold>
                                {new Date(data.lastPaidAt.seconds * 1000).toDateString()}
                              </AppText>
                            </AppText>
                          )}
                          {data.collectedBy && (
                            <AppText size="min" muted className="mt-1">
                              Collected by:{' '}
                              <AppText size="min" semibold>
                                {data.collectedBy.name}
                              </AppText>
                            </AppText>
                          )}
                          {!isPending && data.remark && (
                            <View
                              className="mt-2 rounded-lg px-3 py-2"
                              style={{ backgroundColor: colors.primarySoft }}>
                              <AppText size="min" primary>
                                Remark: {data.remark}
                              </AppText>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          {filter == 'history' && (
            <View className="mx-6 mt-6">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.primarySoft }}>
                  <History size={20} color={colors.primary} />
                </View>
                <View>
                  <AppText semibold>Payment History</AppText>
                  <AppText size="min" muted>
                    Transaction records & receipts
                  </AppText>
                </View>
              </View>
              <View className="mt-4 gap-5">
                {payments.map((p) => (
                  <View
                    key={p.id}
                    className="overflow-hidden rounded-xl"
                    style={{
                      backgroundColor: colors.bgCard,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    <View
                      className="px-5 py-4"
                      style={{
                        backgroundColor: colors.bg,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}>
                      <View className="flex-row items-center justify-between">
                        <View>
                          <AppText size="min" muted>
                            Receipt No
                          </AppText>
                          <AppText size="subtext" semibold>
                            {p.receiptNo || '—'}
                          </AppText>
                        </View>
                        <View className="items-end">
                          <AppText size="min" muted>
                            Amount Paid
                          </AppText>
                          <AppText size="label" semibold>
                            ₹{p.paidAmount}
                          </AppText>
                        </View>
                      </View>
                    </View>
                    <View className="px-5 py-4">
                      {p.months?.length > 0 && (
                        <View className="mb-4">
                          <AppText size="min" muted>
                            Fee Period
                          </AppText>
                          <View className="mt-1 flex-row flex-wrap gap-2">
                            {p.months.map((m: string) => (
                              <View
                                key={m}
                                className="rounded-full px-3 py-1"
                                style={{
                                  backgroundColor: colors.primarySoft,
                                  borderWidth: 1,
                                  borderColor: colors.primary,
                                }}>
                                <AppText size="min" semibold primary>
                                  {formatMonthLabel(m)}
                                </AppText>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      <View className="flex-row justify-between">
                        <MetaItem label="Payment Mode" value={p.paymentMode?.toUpperCase()} />
                        <MetaItem label="Collected By" value={p.collectedBy?.name || 'System'} />
                        <MetaItem
                          label="Paid On"
                          value={new Date(p.createdAt.seconds * 1000).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        />
                        <View />
                      </View>
                      {p.remark && (
                        <View
                          className="mt-4 rounded-xl px-4 py-3"
                          style={{ backgroundColor: colors.primarySoft }}>
                          <AppText size="min" primary>
                            Remark: {p.remark}
                          </AppText>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => downloadReceipt(p)}
                      className="flex-row items-start justify-end gap-2 px-6 py-3"
                      style={{
                        backgroundColor: colors.bg,
                        borderTopWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <Download size={15} color={colors.primary} />
                      <AppText size="subtext" semibold primary>
                        Download Receipt
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              {lastDoc && (
                <TouchableOpacity
                  onPress={loadMorePayments}
                  disabled={loadingMore}
                  className="mt-5 items-center rounded-xl py-3"
                  style={{
                    backgroundColor: colors.primarySoft,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}>
                  <AppText size="label" semibold primary>
                    {loadingMore ? 'Loading history...' : 'Load More History'}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </ScrollView>
    </Screen>
  );
}

function HeroMetric({ label, value, danger }: any) {
  return (
    <View>
      <AppText size="min" semibold alwaysWhite>
        {label}
      </AppText>
      <AppText size="title" semibold alwaysWhite>
        {value}
      </AppText>
    </View>
  );
}

function AmountPill({ label, value, color, bgColor, icon: Icon }: any) {
  return (
    <View
      className="flex-1 rounded-lg px-3 py-1.5"
      style={{
        backgroundColor: bgColor + '55',
        borderWidth: 1,
        borderColor: color + '22',
      }}>
      <View className="mb-0.5 flex-row items-center gap-1">
        {Icon && <Icon size={12} color={color} />}
        <AppText size="min" muted semibold>
          {label}
        </AppText>
      </View>
      <AppText size="subtext" semibold style={{ color }}>
        ₹ {value}
      </AppText>
    </View>
  );
}

function MetaItem({ label, value }: any) {
  return (
    <View className="gap-0.5">
      <AppText size="min" muted>
        {label}
      </AppText>
      <AppText semibold size="min">
        {value || '-'}
      </AppText>
    </View>
  );
}
