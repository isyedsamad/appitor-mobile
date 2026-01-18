import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { CalendarRange, ClipboardList } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

function getExamStatus(start: string, end: string) {
  const today = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (today < s) return "upcoming";
  if (today >= s && today <= e) return "active";
  return "completed";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EmployeeExamsPage() {
  const { schoolUser } = useAuth();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const ref = doc(
          db,
          "schools",
          schoolUser.schoolId,
          "settings",
          "academic",
        );
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const list = snap.data().sessions;
        const current = snap.data().currentSession;
        setSessions(list);
        setSession(current || list[0]?.id);
      } catch(err) {
        Toast.show({
          type: "error",
          text1: "Failed to load sessions",
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
            "schools",
            schoolUser.schoolId,
            "branches",
            schoolUser.currentBranch,
            "exams",
            "items",
            "exam_terms"
          ),
          where("session", "==", session),
          orderBy("startDate", "asc")
        );
        const snap = await getDocs(q);
        setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Failed to load exams",
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
      active: exams.filter(
        e => getExamStatus(e.startDate, e.endDate) === "active"
      ).length,
      upcoming: exams.filter(
        e => getExamStatus(e.startDate, e.endDate) === "upcoming"
      ).length,
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
        className="px-5 mt-5"
        contentContainerStyle={{ paddingRight: 30 }}
      >
        {sessions.map((s: any) => {
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
              <AppText size="label" semibold primary={active}>
                {s.id}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View className="flex-row mx-5 mt-4 gap-2">
        <Stat label="Total Exams" value={counts.total} />
        <Stat label="Active" value={counts.active} accent="primary" />
        <Stat label="Upcoming" value={counts.upcoming} accent="warning" />
      </View>
      <View className="px-5 mt-4">
        {exams.length === 0 ? (
          <View className="items-center py-20">
            <AppText muted>No exams found for this session</AppText>
          </View>
        ) : (
          exams.map(exam => {
            const status = getExamStatus(exam.startDate, exam.endDate);
            const statusColor =
              status === "active"
                ? colors.primary
                : status === "upcoming"
                ? colors.statusLtext
                : colors.textMuted;
            const statusBg =
              status === "active"
                ? colors.primarySoft
                : status === "upcoming"
                ? colors.statusLbg
                : colors.bg;

            return (
              <TouchableOpacity
                key={exam.id}
                onPress={() =>
                  router.push({
                    pathname: "/(employee)/exams/[termId]/marks",
                    params: { termId: exam.id },
                  })
                }
                className="mb-4 p-5 rounded-2xl"
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.85}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <AppText size="title" semibold>
                      {exam.name}
                    </AppText>
                    <AppText size="subtext" muted>
                      Exam Term
                    </AppText>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: statusBg }}
                  >
                    <AppText size="min" semibold style={{ color: statusColor }}>
                      {status.toUpperCase()}
                    </AppText>
                  </View>
                </View>
                <View className="flex-row items-center gap-2 mt-3">
                  <CalendarRange size={16} color={colors.textMuted} />
                  <AppText size="min" muted semibold>
                    {formatDate(exam.startDate)} →{" "}
                    {formatDate(exam.endDate)}
                  </AppText>
                </View>

                <View className="flex-row items-center gap-2 mt-4 pt-3 border-t"
                  style={{ borderColor: colors.border }}
                >
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

function Stat({ label, value, accent }: any) {
  const { colors } = useTheme();
  const color =
    accent === "primary"
      ? colors.primary
      : accent === "warning"
      ? colors.statusLtext
      : colors.text;
  return (
    <View
      className="flex-1 px-4 py-3 rounded-xl"
      style={{
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <AppText size="min" muted>
        {label}
      </AppText>
      <AppText size="title" semibold style={{ color }}>
        {value == 0 ? value : value.toString().padStart(2, "0")}
      </AppText>
    </View>
  );
}
