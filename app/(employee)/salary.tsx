import { doc, getDoc } from 'firebase/firestore';
import { Banknote, LineSquiggle } from 'lucide-react-native';
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

const formatMonthLabel = (key: string) => {
  const [month, year] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export default function EmployeeSalaryPortal() {
  const { schoolUser } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<string[]>([]);
  const [session, setSession] = useState('');
  const [payslips, setPayslips] = useState<any[]>([]);

  useEffect(() => {
    setSessions(schoolUser.sessions?.map((s: any) => s.id) || []);
    setSession(schoolUser.currentSession);
  }, [schoolUser]);

  useEffect(() => {
    if (!session) return;
    loadPayrollData();
  }, [session]);

  async function loadPayrollData() {
    setLoading(true);
    try {
      const payrollRef = doc(
        db,
        'schools', schoolUser.schoolId,
        'branches', schoolUser.currentBranch,
        'employees', schoolUser.uid,
        'payroll', session
      );
      const payrollSnap = await getDoc(payrollRef);
      if (payrollSnap.exists()) {
        const data = payrollSnap.data();
        const sortedPayslips = (data.payslips || []).sort((a: any, b: any) => {
          const [m1, y1] = a.monthYear.split('-').map(Number);
          const [m2, y2] = b.monthYear.split('-').map(Number);
          return (y1 * 12 + m1) - (y2 * 12 + m2);
        });
        setPayslips(sortedPayslips);
      } else {
        setPayslips([]);
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load payroll data',
      });
    } finally {
      setLoading(false);
    }
  }

  const totals = React.useMemo(() => {
    return payslips.reduce((acc, p) => ({
      earnings: acc.earnings + (p.netPayable || 0),
      paid: acc.paid + (p.paidAmount || 0),
    }), { earnings: 0, paid: 0 });
  }, [payslips]);

  if (loading && payslips.length === 0) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Salary & Payroll" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-5 px-5"
          contentContainerStyle={{ paddingRight: 30 }}>
          {sessions.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSession(s)}
              className="mr-2 rounded-full px-4 py-1.5"
              style={{
                backgroundColor: s === session ? colors.primarySoft : colors.bgCard,
                borderWidth: 1,
                borderColor: s === session ? colors.primary : colors.border,
              }}>
              <AppText size="label" semibold primary={s === session}>
                {s}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="mx-5 mt-5 rounded-xl px-6 py-5" style={{ backgroundColor: colors.primary }}>
          <View className="flex-row items-center gap-2 mb-1">
            <Banknote size={16} color="#fff" />
            <AppText alwaysWhite size="label" semibold>Session Summary</AppText>
          </View>
          <View className="flex-row justify-between mt-3">
            <View>
              <AppText alwaysWhite size="min">Net Payable</AppText>
              <AppText alwaysWhite size="title" semibold>₹ {totals.earnings}</AppText>
            </View>
            <View>
              <AppText alwaysWhite size="min">Total Paid</AppText>
              <AppText alwaysWhite size="title" semibold>₹ {totals.paid}</AppText>
            </View>
            <View>
              <AppText alwaysWhite size="min">Balance</AppText>
              <AppText alwaysWhite size="title" semibold>₹ {totals.earnings - totals.paid}</AppText>
            </View>
          </View>
        </View>

        <View className="mx-6 mt-6">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.primarySoft }}>
              <LineSquiggle size={20} color={colors.primary} />
            </View>
            <View>
              <AppText semibold>Monthly Payslips</AppText>
              <AppText size="min" muted>Detailed salary breakdown</AppText>
            </View>
          </View>

          <View className="mt-5 gap-4 mb-10">
            {payslips.map((p, idx) => (
              <View
                key={idx}
                className="rounded-xl p-5 border"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
              >
                <View className="flex-row items-start justify-between">
                  <View>
                    <AppText semibold size="body">{formatMonthLabel(p.monthYear)}</AppText>
                    <AppText size="min" muted>Generated on {new Date(p.updatedAt?.seconds * 1000).toDateString()}</AppText>
                  </View>
                  <View
                    className="rounded-full px-3 py-1"
                    style={{
                      backgroundColor: p.status === 'paid' ? colors.statusPbg : p.status === 'partial' ? colors.statusLbg : colors.statusAbg,
                      borderWidth: 1,
                      borderColor: p.status === 'paid' ? colors.statusPborder : p.status === 'partial' ? colors.statusLtext : colors.statusAborder
                    }}
                  >
                    <AppText size="min" semibold style={{ color: p.status === 'paid' ? colors.statusPtext : p.status === 'partial' ? colors.statusLtext : colors.statusAtext }}>
                      {p.status?.toUpperCase()}
                    </AppText>
                  </View>
                </View>

                <View className="mt-4 flex-row justify-between gap-2">
                  <View className="flex-1 rounded-xl px-4 py-3" style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
                    <AppText size="min" muted semibold>Net Payable</AppText>
                    <AppText semibold size="label">₹ {p.netPayable}</AppText>
                  </View>
                  <View className="flex-1 rounded-xl px-4 py-3" style={{ backgroundColor: colors.statusPbg, borderWidth: 1, borderColor: colors.statusPborder }}>
                    <AppText size="min" semibold style={{ color: colors.statusPtext }}>Paid Amount</AppText>
                    <AppText semibold size="label" style={{ color: colors.statusPtext }}>₹ {p.paidAmount}</AppText>
                  </View>
                </View>

                <View className="mt-4 rounded-2xl p-4" style={{ backgroundColor: colors.bg }}>
                  <AppText size="label" semibold>Salary Breakdown</AppText>

                  <View className="mt-3 gap-2">
                    <AppText size="min" muted semibold>Earnings</AppText>
                    {p.earnings?.map((e: any, i: number) => (
                      <View key={i} className="flex-row justify-between">
                        <AppText size="min">{e.name}</AppText>
                        <AppText size="min" semibold>₹ {e.amount}</AppText>
                      </View>
                    ))}

                    <View className="h-[1px] my-1" style={{ backgroundColor: colors.border }} />

                    <AppText size="min" muted semibold>Deductions</AppText>
                    {p.deductions?.map((d: any, i: number) => (
                      <View key={i} className="flex-row justify-between">
                        <AppText size="min">{d.name}</AppText>
                        <AppText size="min" semibold style={{ color: colors.statusAtext }}>- ₹ {d.amount}</AppText>
                      </View>
                    ))}

                    {p.lopAmount > 0 && (
                      <View className="flex-row justify-between">
                        <AppText size="min">LOP ({p.lopDays} days)</AppText>
                        <AppText size="min" semibold style={{ color: colors.statusAtext }}>- ₹ {p.lopAmount}</AppText>
                      </View>
                    )}

                    {p.adjustments !== 0 && (
                      <View className="flex-row justify-between">
                        <AppText size="min">Adjustments</AppText>
                        <AppText size="min" semibold style={{ color: p.adjustments > 0 ? colors.statusPtext : colors.statusAtext }}>
                          {p.adjustments > 0 ? '+' : ''} ₹ {p.adjustments}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {payslips.length === 0 && !loading && (
              <View className="items-center py-20">
                <AppText muted>No payroll data found for this session</AppText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
