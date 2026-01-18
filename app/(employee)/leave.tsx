import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import secureAxios from "@/lib/secureAxios";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { doc, getDoc } from "firebase/firestore";
import { AlertTriangle, CalendarRange, ChevronRight, ChevronRightCircle, CircleX, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
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

const getDaysBetween = (from: Date, to: Date) => {
  const days = [];
  const cur = new Date(from);
  while (cur <= to) {
    days.push(
      cur.toLocaleDateString("en-IN", { weekday: "long" })
    );
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

export default function EmployeeLeavePage() {
  const { schoolUser } = useAuth();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState("");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState<Date | null>(null);
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawLeave, setWithdrawLeave] = useState<any>(null);

  const STATUS_UI = {
    'pending': {
      bg: colors.statusLbg,
      text: colors.statusLtext,
      border: colors.statusLborder,
      label: "PENDING",
    },
    'approved': {
      bg: colors.statusPbg,
      text: colors.statusPtext,
      border: colors.statusPborder,
      label: "APPROVED",
    },
    'rejected': {
      bg: colors.statusAbg,
      text: colors.statusAtext,
      border: colors.statusAborder,
      label: "REJECTED",
    },
  };  

  useEffect(() => {
    async function loadSessions() {
      const ref = doc(db, "schools", schoolUser.schoolId, "settings", "academic");
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      setSessions(snap.data().sessions);
      setSession(snap.data().currentSession || snap.data().sessions[0]?.id);
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!session) return;
    async function loadLeaves() {
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
          "leave",
          session
        );
        const snap = await getDoc(ref);
        setLeaves(snap.exists() ? snap.data().items || [] : []);
      } finally {
        setLoading(false);
      }
    }
    loadLeaves();
  }, [session]);

  const summary = useMemo(() => ({
    total: leaves.length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    pending: leaves.filter(l => l.status === "pending").length,
  }), [leaves]);

  const daysList = useMemo(() => {
    if (mode === "single") return [fromDate.toLocaleDateString("en-IN", { weekday: "long" })];
    if (!toDate) return [];
    return getDaysBetween(fromDate, toDate);
  }, [fromDate, toDate, mode]);

  const totalDays = daysList.length || 1;

  async function saveLeave() {
    if (!reason.trim()) {
      Toast.show({ type: "error", text1: "Please enter Leave Reason",
        text2: 'enter a valid reason to request!'
       });
      return;
    }
    if(mode == 'multi' && !toDate) {
      Toast.show({ type: "error", text1: "Please Select To-Date",
        text2: 'select a valid to-date to request!'
       });
      return;
    }
    setLoading(true);
    try {
      await secureAxios.post("/api/school/leave/create", {
        type: 'employee',
        branch: schoolUser.currentBranch,
        session,
        reason,
        from: formatDMY(fromDate),
        to: mode === "multi" && toDate ? formatDMY(toDate) : null,
        days: totalDays,
        appId: schoolUser.employeeId,
      });
      Toast.show({ type: "success", text1: "Leave requested successfully" });
      setOpenAdd(false);
      setReason("");
      setMode("single");
      setToDate(null);
    } catch(err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send Request',
        text2: 'Error: ' + err.response.data.message
      })
    } finally {
      setLoading(false);
    }
  }

  async function confirmWithdraw() {
    try {
      setLoading(true);
      await secureAxios.post("/api/school/leave/withdraw", {
        type: "employee",
        branch: schoolUser.currentBranch,
        session,
        leaveId: withdrawLeave.id,
      });
      Toast.show({
        type: "success",
        text1: "Leave withdrawn successfully",
      });
      setShowWithdrawConfirm(false);
      setWithdrawLeave(null);
      setLeaves(prev => prev.filter(l => l.id !== withdrawLeave.id));
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to withdraw Leave",
        text2: 'Error: ' + err.response.data.message
      });
    } finally {
      setLoading(false);
    }
  }  

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header
        title="Leave Portal"
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mt-5"
          contentContainerStyle={{ paddingRight: 30 }}>
          {sessions.map((s: any) => {
            const active = s.id === session;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSession(s.id)}
                className="px-5 py-2 mr-2 rounded-full"
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

        <View
          className="mx-5 mt-5 px-6 py-5 rounded-2xl border"
          style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <AppText size="label" muted>
                Leave Overview
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
                Total: {summary.total == 0 ? summary.total : summary.total.toString().padStart(2, '0')}
              </AppText>
            </View>
          </View>
          <View
            className="my-4"
            style={{ height: 1, backgroundColor: colors.border }}
          />
          <View className="flex-row gap-4">
            <SummaryItem
              label="Approved"
              value={summary.approved}
              variant="approved"
            />
            <SummaryItem
              label="Rejected"
              value={summary.rejected}
              variant="rejected"
            />
          </View>
        </View>

        <View
            className="my-4 mx-3"
            style={{ height: 1, backgroundColor: colors.border }}
          />

        <View className="px-5">
          {leaves.length === 0 ? (
            <View className="items-center py-20">
              <AppText muted>No leave requests found</AppText>
            </View>
          ) : (
            leaves.map((l: any) => {
              const ui = STATUS_UI[l.status as keyof typeof STATUS_UI];
              return (
                <View
                  key={l.id}
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
                          {l.reason}
                        </AppText>
                        <AppText size="min" muted semibold>
                          Leave Request
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
                    <View className="flex-row items-center gap-3 mt-4">
                      <View
                        className="px-4 py-3 rounded-lg"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <CalendarRange size={18} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <AppText semibold size="label">
                          {l.from}
                          {l.to ? ` → ${l.to}` : ""}
                        </AppText>
                        <AppText size="min" muted semibold>
                          {l.days} day{l.days > 1 ? "s" : ""}
                        </AppText>
                      </View>
                    </View>
                  </View>
                  {l.status === "pending" && (
                    <>
                    <View style={{ borderTopWidth: 1, borderColor: colors.statusAborder }}></View>
                    <TouchableOpacity
                      onPress={() => {
                        setWithdrawLeave(l);
                        setShowWithdrawConfirm(true);
                      }}
                      className="flex-row items-center gap-2 px-6 py-4"
                      style={{ backgroundColor: colors.statusAbg }}
                    >
                      <Trash2 size={13} color={colors.statusAtext} />
                      <AppText size="subtext" semibold style={{ color: colors.statusAtext }}>
                        Withdraw Leave Request
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
      <Modal visible={openAdd} statusBarTranslucent transparent animationType="slide" onRequestClose={() => setOpenAdd(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl px-6 pt-6 max-h-[80vh]"
            style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row justify-start gap-2 items-center">
                <ChevronRightCircle size={18} color={colors.primary} />
                <AppText size="title" semibold>Request Leave</AppText>
              </View>
              <TouchableOpacity onPress={() => setOpenAdd(false)}>
                <CircleX size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <AppText size="label" muted>Reason</AppText>
              <TextInput
                placeholder="Explain briefly why you need leave…"
                placeholderTextColor={colors.textMuted}
                multiline
                value={reason}
                onChangeText={setReason}
                className="mt-1 px-4 py-4 rounded-2xl border"
                style={{
                  minHeight: 90,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlignVertical: "top",
                }}
              />
              <View className="flex-row gap-3 mt-5">
                {["single", "multi"].map(t => {
                  const active = mode === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setMode(t as any)}
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? colors.primarySoft : colors.bg,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                    >
                      <AppText semibold primary={active}>
                        {t === "single" ? "Single Day" : "Multiple Days"}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View className="mt-1">
                <DatePicker label="From" date={fromDate} onChange={setFromDate} />
                {mode === "multi" && (
                  <DatePicker label="To" date={toDate} onChange={setToDate} />
                )}
              </View>
              <View
                className="mt-4 px-5 py-4 rounded-xl border"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.primary,
                }}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <AppText size="label" muted primary>
                      Leave Summary
                    </AppText>
                    <AppText size="body" semibold className="mt-1">
                      {totalDays} Day{totalDays > 1 ? "s" : ""}
                    </AppText>
                  </View>
                </View>
                <View
                  className="my-2"
                  style={{ height: 1, backgroundColor: colors.border }}
                />
                <View className="flex-row flex-wrap gap-1 mt-1">
                  {daysList.map((day, i) => (
                    <View
                      key={i}
                      className="px-3 py-1.5 rounded-full border"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      }}
                    >
                      <AppText size="min" semibold>
                        {day}
                      </AppText>
                    </View>
                  ))}
                </View>
                <AppText size="min" muted className="mt-2">
                  Please review the above details before submitting your leave request.
                </AppText>
              </View>
              <TouchableOpacity
                onPress={saveLeave}
                className="mt-6 py-4 rounded-2xl flex-row justify-center gap-2 items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <ChevronRight size={18} color={'#fff'} />
                <AppText semibold style={{ color: "#fff" }}>
                  Submit Leave Request
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
        onRequestClose={() => setShowWithdrawConfirm(false)}
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
              <AlertTriangle size={26} color={colors.statusAtext} />
            </View>
            <AppText size="title" semibold>
              Withdraw Leave?
            </AppText>
            <AppText muted className="mt-1">
              Are you sure you want to withdraw this leave request? This action
              cannot be undone.
            </AppText>
            <View className="mt-4 p-4 rounded-2xl"
              style={{ backgroundColor: colors.bg }}
            >
              <AppText semibold>
                {withdrawLeave?.from}
                {withdrawLeave?.to ? ` → ${withdrawLeave.to}` : ""}
              </AppText>
              <AppText size="min" muted>
                {withdrawLeave?.days} day(s)
              </AppText>
            </View>
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
                <AppText semibold style={{ color: colors.statusAtext }}>
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
    variant === "approved"
      ? {
          bg: colors.statusPbg,
          text: colors.statusPtext,
          border: colors.statusPborder,
        }
      : {
          bg: colors.statusAbg,
          text: colors.statusAtext,
          border: colors.statusAborder,
        };
  return (
    <View
      className="flex-1 px-5 py-3 rounded-xl border"
      style={{
        backgroundColor: ui.bg,
        borderColor: ui.border,
      }}
    >
      <AppText size="min" semibold>
        {label}
      </AppText>
      <AppText
        size="title"
        semibold
        style={{ color: ui.text }}
      >
        {value == 0 ? value : value.toString().padStart(2, "0")}
      </AppText>
    </View>
  );
}


function DatePicker({ label, date, onChange }: any) {
  const { colors } = useTheme();

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date || new Date(),
        mode: "date",
        onChange: (_, d) => d && onChange(d),
      });
    }
  };

  return (
    <View className="mt-3">
      <AppText size="label" muted>{label} Date</AppText>
      <TouchableOpacity
        onPress={open}
        className="mt-1 px-4 py-3 rounded-xl border"
        style={{ borderColor: colors.border }}>
        <AppText semibold>{date ? formatDMY(date) : "Select date"}</AppText>
      </TouchableOpacity>
    </View>
  );
}
