import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc
} from "firebase/firestore";
import { CircleX } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  TouchableOpacity,
  View
} from "react-native";
import { LineChart } from 'react-native-gifted-charts';
import Toast from "react-native-toast-message";

const screenWidth = Dimensions.get("window").width;

const MONTHS = [
  "April","May","June","July","August","September",
  "October","November","December","January","February","March"
];

const getMonthKey = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

const safePercent = (p: number, total: number) =>
  total === 0 ? 0 : Math.round((p / total) * 100);

export default function MyAttendancePage() {
  const { schoolUser } = useAuth();
  const { colors } = useTheme();

  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState("");
  // const [monthsData, setMonthsData] = useState<any>({});
  const [sessionData, setSessionData] = useState<any>(null);
  const [monthDays, setMonthDays] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [daysInMonth, setDaysInMonth] = useState(0);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const ref = doc(
          db,
          "schools",
          schoolUser.schoolId,
          "settings",
          "academic"
        );
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const data = snap.data();
        setSessions(data.sessions || []);
        setSession(data.currentSession);
        setLoading(false);
      } catch(err: any) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Sessions',
          text2: 'Error: ' + err
        })
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!session) return;
    async function loadSessionData() {
      setLoading(true);
      const ref = doc(
        db,
        "schools",
        schoolUser.schoolId,
        "branches",
        schoolUser.currentBranch,
        "employees",
        schoolUser.uid,
        "attendance_session",
        session
      );
      const snap = await getDoc(ref);
      setSessionData(snap.exists() ? snap.data() : null);
      setLoading(false);
    }
  
    loadSessionData();
  }, [session]);  

  const summary = useMemo(() => {
    let P = 0, A = 0, L = 0, H = 0, O = 0;
    Object.values(sessionData?.months || {}).forEach((m: any) => {
      P += m.P || 0;
      A += m.A || 0;
      L += m.L || 0;
      H += m.H || 0;
      O += m.O || 0;
    });
    const total = P + A + L + H;
    return { P, A, L, H, O, total };
  }, [sessionData]);

  const graphData = useMemo(() => {
    const labels: string[] = [];
    const values: number[] = [];
    MONTHS.forEach((m, i) => {
      const [startYear] = session.split("-");
      const year =
        i < 9 ? Number(startYear) : Number(startYear) + 1;
      const key = getMonthKey(year, i < 9 ? i + 3 : i - 9);
      const data = sessionData?.months?.[key];
      const p = data?.P || 0;
      const t =
        (data?.P || 0) +
        (data?.A || 0) +
        (data?.L || 0) +
        (data?.H || 0);

      labels.push(m.slice(0, 3));
      values.push(safePercent(p, t));
    });
    return { labels, values };
  }, [sessionData, session]);

  const getDaysInMonth = (monthKey: string): number => {
    if(!monthKey) return 0;
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const formatMonthKey = (monthKey: string): string => {
    if(!monthKey) return '';
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-IN', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const lineData = graphData.labels.map((label, i) => ({
    value: graphData.values[i],
    label: label
  }));

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="My Attendance" />
      <ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mt-5" 
        contentContainerStyle={{ paddingRight: 30 }}>
        {sessions.map(s => {
          const active = s.id === session;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSession(s.id)}
              className="px-5 py-2 mr-3 rounded-full"
              style={{
                backgroundColor: active ? colors.primarySoft : colors.bgCard,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <AppText size="label" semibold primary={active}>{s.id}</AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="mx-5 mt-4 p-5 rounded-2xl" style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
        <View className="flex-row justify-between">
          <AppText size="title" semibold>{session}</AppText>
          <View className="rounded-lg px-3 py-1" style={{ backgroundColor: colors.primary }}>
            <AppText semibold alwaysWhite>
              {safePercent(summary.P, summary.total)} %
            </AppText>
          </View>
        </View>
        {safePercent(summary.P, summary.total) < 75 && (
          <AppText size="subtext" style={{ color: colors.statusAtext }}>
            ⚠ Attendance below recommended level
          </AppText>
        )}
        <View className="flex-row mt-4 justify-between">
          {[
            ["Present", summary.P, colors.statusPbg, colors.statusPtext],
            ["Absent", summary.A, colors.statusAbg, colors.statusAtext],
            ["Leave", summary.L, colors.statusLbg, colors.statusLtext],
            ["Half Day", summary.H, colors.statusHbg, colors.statusHtext],
            ["OverTime", summary.O, colors.statusObg, colors.statusOtext],
          ].map(([label, val, bg, tx]: any) => (
            <View key={label} className="items-center">
              <AppText size="min" muted semibold>{label}</AppText>
              <View className="mt-1 px-3 py-2 rounded-lg" style={{ backgroundColor: bg }}>
                <AppText size="title" semibold style={{ color: tx }}>{val == 0 ? val : val.toString().padStart(2, '0')}</AppText>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-5 mt-4 p-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
        <AppText semibold>Yearly Attendance Trend</AppText>
        <View className="h-4"></View>
        <LineChart
          data={lineData}
          height={200}
          initialSpacing={10}
          spacing={25}
          color={colors.primary}
          dataPointsColor={colors.text}
          rulesColor={colors.textMuted}
          xAxisColor={colors.textMuted}
          yAxisColor={colors.textMuted}
          verticalLinesColor={colors.border}
          textColor={colors.textMuted}
          adjustToWidth
          curved
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 11 }}
          yAxisLabelWidth={20}
        />
      </View>

      <View className="mt-4 px-5">
        {MONTHS.map((m, i) => {
          const [startYear] = session.split("-");
          const year = i < 9 ? Number(startYear) : Number(startYear) + 1;
          const key = getMonthKey(year, i < 9 ? i + 3 : i - 9);
          const data = sessionData?.months?.[key] || {};
          const total =
            (data.P || 0) +
            (data.A || 0) +
            (data.L || 0) +
            (data.H || 0);

          return (
            <TouchableOpacity
              key={key}
              onPress={async () => {
                setSelectedMonth({ key });
                setDaysInMonth(getDaysInMonth(key))
                setMonthDays(null);
                setLoading(true);
                try {
                  const ref = doc(
                    db,
                    "schools",
                    schoolUser.schoolId,
                    "branches",
                    schoolUser.currentBranch,
                    "employees",
                    schoolUser.uid,
                    "attendance_month",
                    key
                  );
                  const snap = await getDoc(ref);
                  if(!snap.exists()) {
                    setMonthDays({});
                  }
                  setMonthDays(snap.exists() ? snap.data().days : {});
                } catch(err) {
                  Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Attendance',
                    text2: 'Error: ' + err
                  })
                } finally {
                  setLoading(false);
                }
              }}
              className="px-5 py-4 rounded-2xl mb-4"
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-col justify-start">
                  <AppText semibold>{m} {year}</AppText>
                  <AppText size="min" muted semibold>{total == 0 ? total : total.toString().padStart(2, '0')} Working Days</AppText>
                </View>
                <View className="rounded-lg px-3 py-1" style={{ backgroundColor: colors.primary }}>
                  <AppText semibold alwaysWhite>
                    {safePercent(data.P || 0, total)} %
                  </AppText>
                </View>
              </View>
              <View className="flex-row mt-4 justify-between">
                {[
                  ["Present", data.P || 0, colors.statusPbg, colors.statusPtext],
                  ["Absent", data.A || 0, colors.statusAbg, colors.statusAtext],
                  ["Leave", data.L || 0, colors.statusLbg, colors.statusLtext],
                  ["Half Day", data.H || 0, colors.statusHbg, colors.statusHtext],
                  ["OverTime", data.O || 0, colors.statusObg, colors.statusOtext],
                ].map(([label, val, bg, tx]: any) => (
                  <View key={label} className="items-center">
                    <AppText size="min" muted semibold>{label}</AppText>
                    <View className="mt-1 px-3 py-2 rounded-lg" style={{ backgroundColor: bg }}>
                      <AppText size="body" semibold style={{ color: tx }}>{val == 0 ? val : val.toString().padStart(2, '0')}</AppText>
                    </View>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={!!selectedMonth} statusBarTranslucent transparent animationType="slide" onRequestClose={() => setSelectedMonth(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl p-8 max-h-[80vh]" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row justify-between mb-4">
              <AppText size="title" semibold>
                {formatMonthKey(selectedMonth?.key)}
              </AppText>
              <TouchableOpacity onPress={() => setSelectedMonth(null)}>
                <CircleX size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-center items-center gap-1">
              <View className="px-2 py-1 flex-1 rounded-lg items-center" style={{ backgroundColor: colors.statusPbg, borderWidth: 1, borderColor: colors.statusPborder }}>
                <AppText size="vmin" semibold style={{ color: colors.statusPtext }}>Present</AppText>
              </View>
              <View className="px-2 py-1 flex-1 rounded-lg items-center" style={{ backgroundColor: colors.statusAbg, borderWidth: 1, borderColor: colors.statusAborder }}>
                <AppText size="vmin" semibold style={{ color: colors.statusAtext }}>Absent</AppText>
              </View>
              <View className="px-2 py-1 flex-1 rounded-lg items-center" style={{ backgroundColor: colors.statusLbg, borderWidth: 1, borderColor: colors.statusLborder }}>
                <AppText size="vmin" semibold style={{ color: colors.statusLtext }}>Leave</AppText>
              </View>
              <View className="px-2 py-1 flex-1 rounded-lg items-center whitespace-nowrap" style={{ backgroundColor: colors.statusHbg, borderWidth: 1, borderColor: colors.statusHborder }}>
                <AppText size="vmin" semibold style={{ color: colors.statusHtext }}>Half Day</AppText>
              </View>
              <View className="px-2 py-1 flex-1 rounded-lg items-center whitespace-nowrap" style={{ backgroundColor: colors.statusObg, borderWidth: 1, borderColor: colors.statusOborder }}>
                <AppText size="vmin" semibold style={{ color: colors.statusOtext }}>Over Time</AppText>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-4 mt-4">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const status = monthDays?.[day];
                const bg =
                  status === "P" ? colors.statusPbg :
                  status === "A" ? colors.statusAbg :
                  status === "L" ? colors.statusLbg :
                  status === "H" ? colors.statusHbg :
                  status === "O" ? colors.statusObg :
                  colors.bg;
                const text =
                  status === "P" ? colors.statusPtext :
                  status === "A" ? colors.statusAtext :
                  status === "L" ? colors.statusLtext :
                  status === "H" ? colors.statusHtext :
                  status === "O" ? colors.statusOtext :
                  colors.text;
                const border =
                    status === "P" ? colors.statusPborder :
                    status === "A" ? colors.statusAborder :
                    status === "L" ? colors.statusLborder :
                    status === "H" ? colors.statusHborder :
                    status === "O" ? colors.statusOborder :
                    colors.border;

                return (
                  <View
                    key={day}
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{ backgroundColor: bg, borderWidth: 1, borderColor: border }}
                  >
                    <AppText semibold style={{ color: text }}>{day}</AppText>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </Screen>
  );
}
