import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import secureAxios from "@/lib/secureAxios";
import {
  doc,
  getDoc
} from "firebase/firestore";
import { CheckCircle, ChevronRightCircle, Search, ShieldCheck, Users, XCircle } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Modal, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

type StatusKey = "P" | "A" | "L" | "M";
const STUDENT_STATUS = {
  P: { label: "P", bg: "statusPbg", text: "statusPtext", border: "statusPborder" },
  A: { label: "A", bg: "statusAbg", text: "statusAtext", border: "statusAborder" },
  L: { label: "L", bg: "statusLbg", text: "statusLtext", border: "statusLborder" },
  M: { label: "M", bg: "statusMbg", text: "statusMtext", border: "statusMborder" },
};

export default function StudentAttendancePage() {
  const { schoolUser, classData } = useAuth();
  const { theme, colors } = useTheme();

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [attendanceDocId, setAttendanceDocId] = useState("");
  const [isMarked, setIsMarked] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [classSearch, setClassSearch] = useState("");

  const selectedClass = useMemo(
    () => classData?.find((c: any) => c.id === classId),
    [classId, classData]
  );
  const selectedSection = useMemo(
    () =>
      selectedClass && selectedClass?.sections?.find((s: any) => s.id === sectionId),
    [sectionId, selectedClass]
  );
  const filteredClasses = useMemo(() => {
    if (!classData) return [];
    return classData.filter((c: any) =>
      c.name.toLowerCase().includes(classSearch.toLowerCase())
    );
  }, [classSearch, classData]);

  async function loadStudents() {
    if (!classId || !sectionId) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields!',
        text2: 'Please select class and section.'
      })
      return;
    }
    setLoadingData(true);
    try {
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, "0")}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${today.getFullYear()}`;

      const docId = `student_${dateStr}_${classId}_${sectionId}`;
      setAttendanceDocId(docId);
      const rosterRef = doc(
        db,
        "schools",
        schoolUser.schoolId,
        "branches",
        schoolUser.currentBranch,
        "meta",
        `${classId}_${sectionId}`
      );
      const snapMeta = await getDoc(rosterRef);
      if (!snapMeta.exists()) {
        setStudents([]);
        return;
      }
      const data = snapMeta.data();
      const students = (data.students || [])
        .map((s: any) => ({
          ...s,
          classId,
          sectionId,
        }))
        .sort((a: any, b: any) =>
          String(a.appId).localeCompare(String(b.appId))
        );
      setStudents(students);
      const attSnap = await getDoc(
        doc(
          db,
          "schools",
          schoolUser.schoolId,
          "branches",
          schoolUser.currentBranch,
          "attendance",
          docId
        )
      );
      if (attSnap.exists()) {
        setIsMarked(true);
        setAttendance(attSnap.data().records || {});
      } else {
        setIsMarked(false);
        const initial: any = {};
        // list.forEach(s => (initial[s.uid] = "P"));
        setAttendance(initial);
      }
    } catch(err) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'Failed: ' + err
      })
    } finally {
      setLoadingData(false);
    }
  }

  function setStatus(uid: string, status: string) {
    if (isMarked) return;
    setAttendance(prev => ({ ...prev, [uid]: status }));
  }

  function markAll(status: string) {
    if (isMarked) return;
    const updated: any = {};
    students.forEach(s => (updated[s.uid] = status));
    setAttendance(updated);
  }

  async function saveAttendance() {
    if (!students.length || isMarked) return;
    setSaving(true);
    try {
      await secureAxios.post("/api/school/attendance/mark", {
        type: "student",
        date: attendanceDocId.split("_")[1],
        className: classId,
        section: sectionId,
        branch: schoolUser.currentBranch,
        session: schoolUser.currentSession,
        records: attendance,
      });
      setIsMarked(true);
      Toast.show({
        type: 'success',
        text1: 'Attendance Marked!'
      })
    } catch(err) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'Failed: ' + err
      })
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo<Record<StatusKey, number>>(() => ({
    P: Object.values(attendance).filter(v => v === "P").length,
    A: Object.values(attendance).filter(v => v === "A").length,
    L: Object.values(attendance).filter(v => v === "L").length,
    M: Object.values(attendance).filter(v => v === "M").length,
  }), [attendance]);

  return (
    <>
      {(loadingData || saving) && <Loading />}
      <Screen>
        <Header title="Attendance" />
        <View className="px-5 mt-6 gap-4">
          <View
            className="px-3 gap-1"
          >
            <View className="flex-row gap-3">
            <View className="flex-1">
            <AppText semibold muted size="label">Class</AppText>
            <TouchableOpacity
              onPress={() => setShowClassPicker(true)}
              activeOpacity={0.85}
              className="px-4 py-3 rounded-xl border flex-row justify-between items-center"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <AppText>
                {selectedClass ? selectedClass.name : "Select Class"}
              </AppText>
              <AppText muted>▼</AppText>
            </TouchableOpacity>
            </View>
            {selectedClass && (
              <View className="flex-1">
                <AppText semibold muted size="label">Section</AppText>
                <TouchableOpacity
                  onPress={() => setShowSectionPicker(true)}
                  activeOpacity={0.85}
                  className="px-4 py-3 rounded-xl border flex-row justify-between items-center"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
                >
                  <AppText>
                    {selectedSection?.name ?? "Select Section"}
                  </AppText>
                  <AppText muted>▼</AppText>
                </TouchableOpacity>
              </View>
            )}
            </View>
            <TouchableOpacity
              onPress={loadStudents}
              className="py-3 rounded-lg mt-3 flex-row justify-center gap-2 items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Search size={15} color="#fff" />
              <AppText semibold style={{ color: "#fff" }}>
                Load Students
              </AppText>
            </TouchableOpacity>
          </View>

          <Modal visible={showClassPicker} animationType="slide" transparent statusBarTranslucent
            onRequestClose={() => setShowClassPicker(false)}>
            <View className="flex-1 justify-end bg-black/30">
              <View
                className="rounded-t-3xl py-7 px-8 max-h-[70vh]"
                style={{ backgroundColor: colors.bgCard }}
              >
                <View className="flex-row items-center gap-2">
                  <ChevronRightCircle size={20} color={colors.text} />
                  <AppText size="title" semibold>Select Class</AppText>
                </View>
                <TextInput
                  placeholder="Search class..."
                  placeholderTextColor={colors.textMuted}
                  className="mt-3 px-5 py-3 rounded-xl border"
                  style={{ borderColor: colors.border, color: colors.text }}
                  onChangeText={setClassSearch}
                />
                <FlatList
                  data={filteredClasses}
                  keyExtractor={item => item.id}
                  className="mt-4 px-5"
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setClassId(item.id);
                        setSectionId("");
                        setStudents([]);
                        setIsMarked(false);
                        setShowClassPicker(false);
                      }}
                      className="py-4 border-b"
                      style={{ borderColor: colors.border }}
                    >
                      <AppText semibold>{item.name}</AppText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showSectionPicker} animationType="slide" transparent statusBarTranslucent
            onRequestClose={() => setShowSectionPicker(false)}>
            <View className="flex-1 justify-end bg-black/30">
              <View
                className="rounded-t-3xl py-7 px-8 max-h-[70vh]"
                style={{ backgroundColor: colors.bgCard }}
              >
                <View className="flex-row items-center gap-2">
                  <ChevronRightCircle size={20} color={colors.text} />
                  <AppText size="title" semibold>Select Section</AppText>
                </View>
                <FlatList
                  data={selectedClass && selectedClass.sections}
                  keyExtractor={sec => sec.id}
                  className="mt-4 px-3"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setSectionId(item.id);
                        setShowSectionPicker(false);
                      }}
                      className="py-4 border-b"
                      style={{ borderColor: colors.border }}
                    >
                      <AppText semibold>{item.name}</AppText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <View className="my-1" style={{ height: 1, backgroundColor: colors.border }} />

          {students.length === 0 && (
            <View
              className="mx-2 p-6 rounded-2xl border items-center"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              }}
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Users size={26} color={colors.primary} />
              </View>
              <AppText size="title" bold className="text-center">
                Ready to mark attendance
              </AppText>
              <AppText
                size="subtext"
                muted
                className="text-center mt-2"
                style={{ lineHeight: 20 }}
              >
                Select a class and section above, then tap{" "}
                <AppText semibold primary>
                  Load Students
                </AppText>{" "}
                to begin marking today’s attendance.
              </AppText>
              <View
                className="mt-4 px-4 py-2 rounded-full"
                style={{ backgroundColor: colors.statusLbg, borderWidth: 1, borderColor: colors.statusLborder }}
              >
                <AppText size="min" style={{ color: colors.statusLtext }}>
                  Tip: Attendance is locked after saving
                </AppText>
              </View>
            </View>
          )}

          {students.length > 0 && (
            <View className="mx-3">
            <View
              className="items-center px-4 py-1.5 rounded-full"
              style={{
                backgroundColor: isMarked
                  ? colors.statusPbg
                  : colors.statusLbg,
                borderWidth: 1,
                borderColor: isMarked
                  ? colors.statusPborder
                  : colors.statusLborder,
              }}
            >
              <AppText semibold
                style={{
                  color: isMarked ? colors.statusPtext : colors.statusLtext,
                }}
              >
                {isMarked ? "Attendance Marked" : "Attendance Not Marked"}
              </AppText>
            </View>
            </View>
          )}

          {students.length > 0 && !isMarked && (
            <View
              className="flex-row gap-3 mx-3"
            >
              <TouchableOpacity
                onPress={() => markAll("P")}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border"
                style={{
                  backgroundColor: colors.statusPbg,
                  borderColor: colors.statusPborder,
                }}
              >
                <CheckCircle size={16} color={colors.statusPtext} />
                <AppText semibold style={{ color: colors.statusPtext }}>
                  All Present
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => markAll("A")}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border"
                style={{
                  backgroundColor: colors.statusAbg,
                  borderColor: colors.statusAborder,
                }}
              >
                <XCircle size={16} color={colors.statusAtext} />
                <AppText semibold style={{ color: colors.statusAtext }}>
                  All Absent
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {students.length > 0 && (
            <View
              className="p-4 rounded-2xl border gap-4 mx-2"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center justify-between">
                <AppText size="label" semibold>
                  Today’s Attendance Summary
                </AppText>
                <AppText size="min" semibold muted>
                  {students.length} Students
                </AppText>
              </View>
              <View className="flex-row flex-wrap justify-between gap-y-4">
              <AnalyticsItem
                label="Present"
                value={summary.P}
                total={students.length}
                bg={colors.statusPbg}
                text={colors.statusPtext}
                border={colors.statusPborder}
              />
              <AnalyticsItem
                label="Absent"
                value={summary.A}
                total={students.length}
                bg={colors.statusAbg}
                text={colors.statusAtext}
                border={colors.statusAborder}
              />
              <AnalyticsItem
                label="Leave"
                value={summary.L}
                total={students.length}
                bg={colors.statusLbg}
                text={colors.statusLtext}
                border={colors.statusLborder}
              />
              <AnalyticsItem
                label="Medical"
                value={summary.M}
                total={students.length}
                bg={colors.statusMbg}
                text={colors.statusMtext}
                border={colors.statusMborder}
              />
              </View>
            </View>
          )}

          {students.length > 0 && (
            <View className="my-1" style={{ height: 1, backgroundColor: colors.border }} />
          )}

          <View className="gap-2">
          {students.map(s => (
            <View
              key={s.uid}
              className="p-5 rounded-2xl border mx-2"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primarySoft }}
                >
                  <AppText bold style={{ color: colors.primary }}>
                    {s.rollNo?.toString().padStart(2, '0') ?? "--"}
                  </AppText>
                </View>
                <View className="flex-1">
                  <AppText size="body" bold className="capitalize">
                    {s.name}
                  </AppText>
                  <AppText size="subtext" semibold muted>
                    App ID: {s.appId ?? "--"}
                  </AppText>
                </View>
              </View>
              <View
                className="my-4"
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  opacity: 0.6,
                }}
              />
              <View className="flex-row justify-between">
                {Object.entries(STUDENT_STATUS).map(([code, cfg]) => {
                  const active = attendance[s.uid] === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      onPress={() => setStatus(s.uid, code)}
                      activeOpacity={0.85}
                      className="flex-1 mx-1 py-3 rounded-xl items-center border"
                      style={{
                        backgroundColor: active
                          ? colors[cfg.bg as keyof typeof colors]
                          : colors.bg,
                        borderColor: active
                          ? colors[cfg.border as keyof typeof colors]
                          : colors.border,
                      }}
                    >
                      <AppText
                        bold
                        style={{
                          color: active
                            ? colors[cfg.text as keyof typeof colors]
                            : colors.textMuted,
                        }}
                      >
                        {cfg.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          </View>

          {students.length > 0 && (
            <TouchableOpacity
              disabled={isMarked}
              onPress={saveAttendance}
              className="py-4 rounded-xl flex-row justify-center gap-2 items-center mx-2 mt-1 mb-5"
              style={{
                backgroundColor: isMarked
                  ? colors.border
                  : colors.primary,
              }}
            >
              <ShieldCheck size={18} color={!isMarked ? '#fff' : theme == 'light' ? '#666' : '#fff'} />
              <AppText semibold style={{ color: !isMarked ? '#fff' : theme == 'light' ? '#666' : '#fff' }}>
                {isMarked ? "Attendance Locked" : "Save Attendance"}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </Screen>
    </>
  );
}


function AnalyticsItem({
  label,
  value,
  total,
  bg,
  text,
  border,
}: {
  label: string;
  value: number;
  total: number;
  bg: string;
  text: string;
  border: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <View
      className="w-[48%] pt-3 pb-4 px-5 rounded-xl border"
      style={{
        backgroundColor: bg,
        borderColor: border,
      }}
    >
      <AppText size="heading" bold style={{ color: text }}>
        {value == 0 ? value : value.toString().padStart(2, '0')}
      </AppText>
      <View className="flex-row items-center justify-between mt-1">
        <AppText size="subtext" semibold style={{ color: text }}>
          {label}
        </AppText>
        <AppText size="min" bold style={{ color: text }}>
          {percentage}%
        </AppText>
      </View>
      <View
        className="h-1 rounded-full mt-1 overflow-hidden"
        style={{
          backgroundColor: "rgba(0,0,0,0.1)",
        }}
      >
        <View
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: text,
          }}
        />
      </View>
    </View>
  );
}