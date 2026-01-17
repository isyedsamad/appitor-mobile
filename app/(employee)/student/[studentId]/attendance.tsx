import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { CircleX, User } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
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

export default function StudentAttendancePage() {
  const { schoolUser, classData } = useAuth();
  const { colors } = useTheme();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [monthDays, setMonthDays] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [daysInMonth, setDaysInMonth] = useState(0);

  useEffect(() => {
    async function loadStudent() {
      try {
        const ref = doc(
          db,
          "schools", schoolUser.schoolId,
          "branches", schoolUser.currentBranch,
          "students", studentId
        );
        const snap = await getDoc(ref);
        if (snap.exists()) setStudent(snap.data());
      } catch {
        Toast.show({ type: "error", text1: "Failed to load student" });
      }
    }
    loadStudent();
  }, [studentId]);

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
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Failed to Load Sessions",
          text2: String(err),
        });
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
        "students",
        studentId,
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
    let P = 0, A = 0, L = 0, M = 0;
    Object.values(sessionData?.months || {}).forEach((m: any) => {
      P += m.P || 0;
      A += m.A || 0;
      L += m.L || 0;
      M += m.M || 0;
    });
    const total = P + A + L + M;
    return { P, A, L, M, total };
  }, [sessionData]);

  const graphData = useMemo(() => {
    if(!sessionData || !session) return;
    const labels: string[] = [];
    const values: number[] = [];
    MONTHS.forEach((m, i) => {
      const [startYear] = session.split("-");
      const year = i < 9 ? Number(startYear) : Number(startYear) + 1;
      const key = getMonthKey(year, i < 9 ? i + 3 : i - 9);
      const data = sessionData?.months?.[key];
      const p = data?.P || 0;
      const t =
        (data?.P || 0) +
        (data?.A || 0) +
        (data?.L || 0) +
        (data?.M || 0);
      labels.push(m.slice(0, 3));
      values.push(safePercent(p, t));
    });
    return { labels, values };
  }, [sessionData, session]);

  const lineData = graphData && graphData.labels.map((label, i) => ({
    value: graphData.values[i],
    label,
  }));

  const getDaysInMonth = (key: string) => {
    if(!key) return 0;
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  };

  const formatMonthKey = (key: string) => {
    if(!key) return;
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  if (loading || !student) return <Loading />;

  const className =
    classData.find((c: any) => c.id === student.className)?.name;
  const sectionName =
    classData
      .find((c: any) => c.id === student.className)
      ?.sections.find((s: any) => s.id === student.section)?.name;
  
  const capitalizeWords = (str: string) => 
    str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );

  return (
    <Screen scroll={false}>
      <Header title="Student Attendance" />
      <ScrollView>
      <View
          className="mx-5 mt-5 p-5 rounded-2xl"
          style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row gap-4 items-center">
            <View
              className="w-10 h-14 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <User size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <AppText size="body" semibold>{capitalizeWords(student.name)}</AppText>
              <AppText size="subtext" muted semibold>
                {student.appId}
              </AppText>
            </View>
            <View
              className="px-2 py-2 rounded-lg"
              style={{ backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }}
            >
              <AppText semibold primary>
                {student.rollNo != null ? student.rollNo == 0 ? student.rollNo : student.rollNo.toString().padStart(2, '0') : '-'}
              </AppText>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-3 mt-4">
            {[
              ["Class", `${className} ${sectionName}`],
              ["Session", student.currentSession],
              ["DOB", student.dob],
              ["Gender", student.gender],
              ["Mobile", student.mobile || '-'],
            ].map(([k, v]) => (
              <View
                key={k}
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.bg }}
              >
                <AppText size="min" muted>{k}</AppText>
                <AppText size="label" semibold>{v}</AppText>
              </View>
            ))}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mt-4">
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
          <View className="flex-row justify-between items-center">
            <View>
              <AppText semibold>{session}</AppText>
              <AppText size="min" muted semibold>
                {summary.total == 0 ? summary.total : summary.total.toString().padStart(2, "0")} Working Days
              </AppText>
            </View>
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
          <View className="flex-row mt-4 justify-around">
            {[
              ["Present", summary.P, colors.statusPbg, colors.statusPtext],
              ["Absent", summary.A, colors.statusAbg, colors.statusAtext],
              ["Leave", summary.L, colors.statusLbg, colors.statusLtext],
              ["Medical", summary.M, colors.statusMbg, colors.statusMtext],
            ].map(([label, val, bg, tx]: any) => (
              <View key={label} className="items-center">
                <AppText size="min" muted semibold>{label}</AppText>
                <View className="mt-1 px-3 py-2 rounded-lg" style={{ backgroundColor: bg }}>
                  <AppText size="title" semibold style={{ color: tx }}>
                    {val == 0 ? val : val.toString().padStart(2, "0")}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View className="mx-5 mt-4 p-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
          <AppText semibold>Yearly Attendance Trend</AppText>
          <View className="h-4" />
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
              (data.M || 0);

            return (
              <TouchableOpacity
                key={key}
                onPress={async () => {
                  setSelectedMonth({ key });
                  setDaysInMonth(getDaysInMonth(key));
                  setMonthDays(null);
                  if(total == 0) return;
                  setLoading(true);
                  try {
                    const ref = doc(
                      db,
                      "schools",
                      schoolUser.schoolId,
                      "branches",
                      schoolUser.currentBranch,
                      "students",
                      studentId,
                      "attendance_month",
                      key
                    );
                    const snap = await getDoc(ref);
                    setMonthDays(snap.exists() ? snap.data().days : {});
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-5 py-4 rounded-2xl mb-4"
                style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <AppText semibold>{m} {year}</AppText>
                    <AppText size="min" muted semibold>
                      {total == 0 ? total : total.toString().padStart(2, "0")} Working Days
                    </AppText>
                  </View>
                  <View className="rounded-lg px-3 py-1" style={{ backgroundColor: colors.primary }}>
                    <AppText semibold alwaysWhite>
                      {safePercent(data.P || 0, total)} %
                    </AppText>
                  </View>
                </View>
                <View className="flex-row mt-4 justify-around">
                  {[
                    ["Present", data.P || 0, colors.statusPbg, colors.statusPtext],
                    ["Absent", data.A || 0, colors.statusAbg, colors.statusAtext],
                    ["Leave", data.L || 0, colors.statusLbg, colors.statusLtext],
                    ["Medical", data.M || 0, colors.statusMbg, colors.statusMtext],
                  ].map(([label, val, bg, tx]: any) => (
                    <View key={label} className="items-center">
                      <AppText size="min" muted semibold>{label}</AppText>
                      <View className="mt-1 px-3 py-2 rounded-lg" style={{ backgroundColor: bg }}>
                        <AppText size="title" semibold style={{ color: tx }}>
                          {val == 0 ? val : val.toString().padStart(2, "0")}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <Modal visible={!!selectedMonth} transparent animationType="slide">
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
                <View className="px-2 py-1 flex-1 rounded-lg items-center whitespace-nowrap" style={{ backgroundColor: colors.statusMbg, borderWidth: 1, borderColor: colors.statusMborder }}>
                  <AppText size="vmin" semibold style={{ color: colors.statusMtext }}>Medical</AppText>
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
                    status === "M" ? colors.statusMbg :
                    colors.bg;

                  const text =
                    status === "P" ? colors.statusPtext :
                    status === "A" ? colors.statusAtext :
                    status === "L" ? colors.statusLtext :
                    status === "M" ? colors.statusMtext :
                    colors.text;

                  const border =
                    status === "P" ? colors.statusPborder :
                    status === "A" ? colors.statusAborder :
                    status === "L" ? colors.statusLborder :
                    status === "M" ? colors.statusMborder :
                    colors.border;

                  return (
                    <View
                      key={day}
                      className="w-11 h-11 rounded-full items-center justify-center"
                      style={{ backgroundColor: bg, borderWidth: 1, borderColor: border }}
                    >
                      <AppText semibold style={{ color: text }}>
                        {day}
                      </AppText>
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
