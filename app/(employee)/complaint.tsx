import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import secureAxios from "@/lib/secureAxios";
import { doc, getDoc } from "firebase/firestore";
import {
  AlertTriangle,
  ChevronRight,
  ChevronRightCircle,
  CircleX,
  Plus,
  Trash2
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const formatDMY = (d: Date) => {
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function EmployeeComplaintPage() {
  const { schoolUser } = useAuth();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState("");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawItem, setWithdrawItem] = useState<any>(null);

  const STATUS_UI = {
    pending: {
      bg: colors.statusLbg,
      text: colors.statusLtext,
      border: colors.statusLborder,
      label: "PENDING",
    },
    solved: {
      bg: colors.statusPbg,
      text: colors.statusPtext,
      border: colors.statusPborder,
      label: "SOLVED",
    },
  };

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
        setSessions(snap.data().sessions);
        setSession(
          snap.data().currentSession || snap.data().sessions[0]?.id
        );
      } catch(err) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load Sessions'
        })
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  async function loadComplaints() {
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
        "complaints",
        session
      );
      const snap = await getDoc(ref);
      setComplaints(snap.exists() ? snap.data().items || [] : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    loadComplaints();
  }, [session]);

  const summary = useMemo(
    () => ({
      total: complaints.length,
      pending: complaints.filter(c => c.status === "pending").length,
      solved: complaints.filter(c => c.status === "solved").length,
    }),
    [complaints]
  );

  async function saveComplaint() {
    if (!title.trim() || !description.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing details",
        text2: "Please enter heading and description",
      });
      return;
    }
    setLoading(true);
    try {
      await secureAxios.post("/api/school/complaint/create", {
        type: "employee",
        branch: schoolUser.currentBranch,
        session,
        title,
        description,
        appId: schoolUser.employeeId,
      });
      Toast.show({
        type: "success",
        text1: "Complaint Submitted",
        text2: "The authorities will respond shortly",
      });
      setOpenAdd(false);
      setTitle("");
      setDescription("");
      await loadComplaints();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to submit complaint",
        text2: "Error: " +err.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function confirmWithdraw() {
    try {
      setLoading(true);
      await secureAxios.post("/api/school/complaint/withdraw", {
        type: "employee",
        branch: schoolUser.currentBranch,
        session,
        complaintId: withdrawItem.id,
      });
      setComplaints(prev =>
        prev.filter(c => c.id !== withdrawItem.id)
      );
      Toast.show({
        type: "success",
        text1: "Complaint withdrawn",
        text2: "Feel free to add more!"
      });
      setShowWithdrawConfirm(false);
      setWithdrawItem(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header
        title="Complaint Portal"
        rightSlot={
          <TouchableOpacity
            onPress={() => setOpenAdd(true)}
            className="p-2 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        }
      />
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
                className="px-5 py-2 mr-2 rounded-full"
                style={{
                  backgroundColor: active
                    ? colors.primarySoft
                    : colors.bgCard,
                  borderWidth: 1,
                  borderColor: active
                    ? colors.primary
                    : colors.border,
                }}
              >
                <AppText size="label" semibold primary={active}>
                  {s.id}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View
          className="mx-5 mt-5 px-6 py-4 rounded-2xl border"
          style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <AppText size="label" muted>
                Complaint Overview
              </AppText>
              <AppText size="title" semibold>
                {session}
              </AppText>
            </View>
            <View
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <AppText semibold style={{ color: colors.primary }}>
                Total:{" "}
                {summary.total == 0 ? summary.total : summary.total
                  .toString()
                  .padStart(2, "0")}
              </AppText>
            </View>
          </View>
          <View
            className="my-4"
            style={{
              height: 1,
              backgroundColor: colors.border,
            }}
          />
          <View className="flex-row gap-3">
            <SummaryItem
              label="Pending"
              value={summary.pending}
              variant="pending"
            />
            <SummaryItem
              label="Solved"
              value={summary.solved}
              variant="solved"
            />
          </View>
        </View>

        <View className="px-5 mt-5">
          {complaints.length === 0 ? (
            <View className="items-center py-20">
              <AppText muted>No complaints found</AppText>
            </View>
          ) : (
            complaints.map(c => {
              const ui = STATUS_UI[c.status as keyof typeof STATUS_UI];
              return (
                <View
                  key={c.id}
                  className="mb-4 rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderWidth: 1,
                    borderColor: ui.border,
                  }}
                >
                  <View className="p-5">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <AppText size="body" semibold>
                          {c.title}
                        </AppText>
                        <AppText size="min" muted semibold>
                          {formatDMY(c.createdAt.toDate())}
                        </AppText>
                      </View>
                      <View
                        className="px-3 py-1.5 rounded-full border"
                        style={{
                          backgroundColor: ui.bg,
                          borderColor: ui.border,
                        }}
                      >
                        <AppText
                          size="min"
                          semibold
                          style={{ color: ui.text }}
                        >
                          {ui.label}
                        </AppText>
                      </View>
                    </View>
                    <AppText
                      size="subtext"
                      className="mt-3"
                    >
                      {c.description}
                    </AppText>
                  </View>
                  {c.status === "pending" && (
                    <>
                      <View
                        style={{
                          borderTopWidth: 1,
                          borderColor: colors.statusAborder,
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          setWithdrawItem(c);
                          setShowWithdrawConfirm(true);
                        }}
                        className="flex-row items-center gap-2 px-6 py-4"
                        style={{
                          backgroundColor: colors.statusAbg,
                        }}
                      >
                        <Trash2
                          size={13}
                          color={colors.statusAtext}
                        />
                        <AppText size="subtext"
                          semibold
                          style={{
                            color: colors.statusAtext,
                          }}
                        >
                          Withdraw Complaint
                        </AppText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={openAdd}
        transparent
        statusBarTranslucent
        animationType="slide"
      >
        <View className="flex-1 justify-end bg-black/60">
          <View
            className="rounded-t-3xl px-6 pt-6 max-h-[80vh]"
            style={{ backgroundColor: colors.bgCard }}
          >
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row gap-2 items-center">
                <ChevronRightCircle
                  size={18}
                  color={colors.primary}
                />
                <AppText size="title" semibold>
                  Raise Complaint
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setOpenAdd(false)}
              >
                <CircleX
                  size={22}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <AppText size="label" muted>
                Heading
              </AppText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Short title for your complaint"
                placeholderTextColor={colors.textMuted}
                className="mt-1 px-4 py-3 rounded-2xl"
                style={{
                  borderWidth: 2,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
              <AppText size="label" muted className="mt-4">
                Description
              </AppText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Explain the issue in detail…"
                placeholderTextColor={colors.textMuted}
                className="mt-1 px-4 py-4 rounded-2xl"
                style={{
                  minHeight: 120,
                  borderWidth: 2,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlignVertical: "top",
                }}
              />
              <TouchableOpacity
                onPress={saveComplaint}
                className="mt-6 py-4 rounded-2xl flex-row justify-center gap-2 items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <ChevronRight size={18} color="#fff" />
                <AppText semibold style={{ color: "#fff" }}>
                  Submit Complaint
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWithdrawConfirm}
        transparent
        statusBarTranslucent
        animationType="fade"
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.bgCard }}
          >
            <View
              className="w-14 h-14 rounded-xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.statusAbg }}
            >
              <AlertTriangle
                size={26}
                color={colors.statusAtext}
              />
            </View>
            <AppText size="title" semibold>
              Withdraw Complaint?
            </AppText>
            <AppText muted className="mt-1">
              Are you sure you want to withdraw this complaint?
            </AppText>
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowWithdrawConfirm(false)}
                className="flex-1 py-3 rounded-xl items-center border"
                style={{ borderColor: colors.border }}
              >
                <AppText semibold>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmWithdraw}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.statusAbg }}
              >
                <AppText
                  semibold
                  style={{ color: colors.statusAtext }}
                >
                  Yes, Withdraw
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SummaryItem({ label, value, variant }: any) {
  const { colors } = useTheme();
  const ui =
    variant === "solved"
      ? {
          bg: colors.statusPbg,
          text: colors.statusPtext,
          border: colors.statusPborder,
        }
      : {
          bg: colors.statusLbg,
          text: colors.statusLtext,
          border: colors.statusLborder,
        };
  return (
    <View
      className="flex-1 px-5 py-3 rounded-xl border"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <AppText size="min" semibold className="uppercase">
        {label}
      </AppText>
      <AppText size="title" semibold style={{ color: variant == 'solved' ? 'green' : 'red' }}>
        {value == 0 ? value : value.toString().padStart(2, "0")}
      </AppText>
    </View>
  );
}
