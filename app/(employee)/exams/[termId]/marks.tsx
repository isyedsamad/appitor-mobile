import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { AlertTriangle, BarChart3, CalendarRange, ChevronRightCircle, ClipboardCheck, Crown, Lock, Save, Search, TrendingUp } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import secureAxios from "@/lib/secureAxios";

const GRADES = ["A", "B", "C", "D", "E", "F"];
const GRADE_POINTS: any = {
  A: 95,
  B: 85,
  C: 70,
  D: 55,
  E: 40,
  F: 30,
};

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

export default function MarksEntryPage() {
  const navigation = useNavigation();
  const dirtyRef = React.useRef(false);
  const { termId } = useLocalSearchParams<{ termId: string }>();
  const { schoolUser, classData, subjectData, employeeData } = useAuth();
  const { theme, colors } = useTheme();

  const getTeacherName = (id: any) =>
    employeeData.find((t: any) => t.id === id)?.name;
  const getSubjectName = (id: any) =>
    subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) =>
    classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) =>
    classData
      ?.find((c: any) => c.id === cid)
      ?.sections.find((s: any) => s.id == sid)?.name;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [setups, setSetups] = useState<any[]>([]);
  const [marks, setMarks] = useState<any>({});
  const [quickSubjectId, setQuickSubjectId] = useState<string | null>(null);
  const inputRefs = React.useRef<TextInput[]>([]);
  const inputOrder = React.useRef<{ stuIndex: number; setupId: string }[]>([]);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  function rebuildInputOrder(stuData: any[], setupData: any[], quickSubjectId: string | null) {
    inputOrder.current = [];
    if (quickSubjectId) {
      const s = setupData.find(x => x.id === quickSubjectId);
      if (!s || s.markingType !== "marks") return;
      stuData.forEach((_, si) => {
        inputOrder.current.push({
          stuIndex: si,
          setupId: s.id,
        });
      });
    } else {
      stuData.forEach((_, si) => {
        setupData.forEach((s) => {
          if (s.markingType === "marks") {
            inputOrder.current.push({
              stuIndex: si,
              setupId: s.id,
            });
          }
        });
      });
    }
  }
  
  useEffect(() => {
    async function loadLock() {
      const ref = doc(
        db,
        "schools",
        schoolUser.schoolId,
        "branches",
        schoolUser.currentBranch,
        "exams",
        "items",
        "exam_terms",
        termId
      );
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setExam(snap.data());
        setLocked(snap.data().resultDeclared === true);
      }
      setLoading(false);
    }
    loadLock();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const sub = navigation.addListener("beforeRemove", (e) => {
        if (!dirtyRef.current) return;
        e.preventDefault();
        setShowDiscardModal(true);
      });
      return sub;
    }, [])
  );  

  async function loadData() {
    if (!classId || !sectionId) {
      Toast.show({ type: "error", text1: "Select class & section" });
      return;
    }
    setLoading(true);
    try {
      const setupQ = query(
        collection(
          db,
          "schools",
          schoolUser.schoolId,
          "branches",
          schoolUser.currentBranch,
          "exams",
          "items",
          "exam_setups"
        ),
        where("termId", "==", termId),
        where("classId", "==", classId),
        where("sectionId", "==", sectionId)
      );
      const setupSnap = await getDocs(setupQ);
      const setupData = setupSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setSetups(setupData);
      const metaRef = doc(
        db,
        "schools",
        schoolUser.schoolId,
        "branches",
        schoolUser.currentBranch,
        "meta",
        `${classId}_${sectionId}`
      );
      const metaSnap = await getDoc(metaRef);
      const stuData = metaSnap.exists()
        ? metaSnap
            .data()
            .students.filter((s: any) => s.status === "active")
            .sort((a: any, b: any) => a.rollNo - b.rollNo)
        : [];
      setStudents(stuData);
      rebuildInputOrder(stuData, setupData, quickSubjectId);
      const loaded: any = {};
      for (const stu of stuData) {
        const q = query(
          collection(
            db,
            "schools",
            schoolUser.schoolId,
            "branches",
            schoolUser.currentBranch,
            "exams",
            "items",
            "student_marks"
          ),
          where("studentId", "==", stu.uid),
          where("termId", "==", termId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.docs[0].data().marks.forEach((m: any) => {
            loaded[`${stu.uid}_${m.setupId}`] = m.value;
          });
        }
      }
      setMarks(loaded);
      dirtyRef.current = false;
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }

  function updateMark(stuId: string, setup: any, raw: any) {
    dirtyRef.current = true;
    setDirty(true);
    if (setup.markingType === "marks") {
      let n = Number(raw);
      if (isNaN(n)) n = 0;
      if (n < 0) n = 0;
      if (n > setup.maxMarks) n = setup.maxMarks;
      setMarks((p: any) => ({ ...p, [`${stuId}_${setup.id}`]: n }));
    } else {
      setMarks((p: any) => ({ ...p, [`${stuId}_${setup.id}`]: raw }));
    }
  }

  async function saveMarks() {
    if (locked) return;
    if (Object.keys(marks).length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Changes Found!',
      })
      return;
    }
    setLoading(true);
    try {
      await secureAxios.post("/api/school/exams/marks", {
        branch: schoolUser.currentBranch,
        session: schoolUser.currentSession,
        termId,
        classId,
        sectionId,
        marks,
      });
      Toast.show({ type: "success", text1: "Marks saved" });
      dirtyRef.current = false;
      setDirty(false);
    } catch(err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to save Marks',
        text2: 'Error: ' + err.response.data.message
      })
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (students.length && setups.length) {
      rebuildInputOrder(students, setups, quickSubjectId);
    }
  }, [quickSubjectId]);

  const visibleSetups = quickSubjectId
    ? setups.filter((s) => s.id === quickSubjectId)
    : setups;

  const classAnalytics = useMemo(() => {
    const result: any[] = [];
    setups.forEach((s) => {
      let totalScore = 0;
      let totalMax = 0;
      const scores: {
        uid: string;
        name: string;
        rollNo: number;
        percent: number;
      }[] = [];
      students.forEach((stu) => {
        const value = marks[`${stu.uid}_${s.id}`];
        if (value == null) return;    
        let percent = 0;
        if (s.markingType === "marks") {
          percent = Math.round((Number(value) / Number(s.maxMarks)) * 100);
        } else if (GRADE_POINTS[value]) {
          percent = GRADE_POINTS[value];
        }
        totalScore += percent;
        totalMax += 100;
        scores.push({
          uid: stu.uid,
          name: stu.name,
          rollNo: stu.rollNo,
          percent,
        });
      });
      scores.sort((a, b) => b.percent - a.percent);
      result.push({
        setupId: s.id,
        subjectName: getSubjectName(s.subjectId),
        avg:
          scores.length > 0
            ? Math.round(totalScore / scores.length)
            : null,
        top: scores[0] || null,
        low: scores[scores.length - 1] || null,
      });
    });    
    return result;
  }, [marks, students, setups]);
  
  const capitalizeWords = (str: string) => {
    if(!str) return; 
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
  }

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Marks Entry" />
      <ScrollView>
      <View className="px-5 mt-4">
      {!exam ? (
        <View className="items-center py-20">
          <AppText muted>No exam found for this session</AppText>
        </View>
      ) : (
        (() => {
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
              className="mt-2 p-5 rounded-2xl"
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
                  {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
                </AppText>
              </View>
            </TouchableOpacity>
          );
        })()
      )}
      </View>
      {locked && (
        <View
          className="mx-5 mt-4 p-4 rounded-2xl flex-row justify-center items-center gap-2"
          style={{ backgroundColor: colors.statusAbg }}
        >
          <Lock size={16} color={colors.statusAtext} />
          <AppText semibold style={{ color: colors.statusAtext }}>
            Result Declared · Editing Locked
          </AppText>
        </View>
      )}
      <View className="flex-row mx-6 mt-5 gap-3">
        <View className="flex-1 gap-1">
          <AppText size="label">Class</AppText>
          <View className="flex-row">
          <TouchableOpacity
            onPress={() => setShowClassPicker(true)}
            className="flex-1 px-4 py-3 rounded-xl border"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
            <AppText>
              {classData.find((c: any) => c.id === classId)?.name || "Select Class"}
            </AppText>
          </TouchableOpacity>
          </View>
        </View>
        <View className="flex-1 gap-1">
            <AppText size="label">Section</AppText>
          <View className="flex-row">
          <TouchableOpacity
            disabled={!classId}
            onPress={() => setShowSectionPicker(true)}
            className="flex-1 px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              opacity: classId ? 1 : 0.5,
            }}>
            <AppText>
              {classData.find((c: any) => c.id === classId)
                ?.sections.find((s: any) => s.id === sectionId)?.name || "Section"}
            </AppText>
          </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={loadData}
        className="mx-6 mt-4 py-3 rounded-xl flex-row gap-2 justify-center items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <Search size={18} color={'#fff'} />
        <AppText semibold alwaysWhite>
          Load Students
        </AppText>
      </TouchableOpacity>
      {students.length === 0 && (
        <View
          className="mx-5 mt-6 p-6 rounded-2xl border items-center"
          style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          }}
        >
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primarySoft }}
          >
            <ClipboardCheck size={26} color={colors.primary} />
          </View>
          <AppText size="title" semibold className="text-center">
            Ready for Marks Entry
          </AppText>
          <AppText
            size="subtext"
            muted
            className="text-center mt-2"
            style={{ lineHeight: 20 }}
          >
            Select a{" "}
            <AppText semibold>Class</AppText> and{" "}
            <AppText semibold>Section</AppText>, then tap{" "}
            <AppText semibold primary>
              Load Students
            </AppText>{" "}
            to begin entering marks for this exam.
          </AppText>
          <View className="mt-4 flex-row gap-2 flex-wrap justify-center">
            <View
              className="px-4 py-2 rounded-full border"
              style={{
                backgroundColor: colors.statusLbg,
                borderColor: colors.statusLborder,
              }}
            >
              <AppText size="min" style={{ color: colors.statusLtext }}>
                Tip: Use subject filter for quick entry
              </AppText>
            </View>
          </View>
          <View
            className="mt-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: colors.statusAbg,
              borderWidth: 1,
              borderColor: colors.statusAborder,
            }}
          >
            <AppText size="min" style={{ color: colors.statusAtext }}>
              Once result is declared, editing will be locked
            </AppText>
          </View>
        </View>
      )}
      {students.length > 0 && (
        <View className="mx-5 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <BarChart3 size={18} color={colors.primary} />
              </View>
              <View>
                <AppText semibold>Class Performance</AppText>
                <AppText size="min" muted>
                  Subject-wise overview
                </AppText>
              </View>
            </View>
          </View>
          <View className="gap-2 flex-row flex-wrap">
            {classAnalytics.map((a) => (
              <View
                key={a.setupId}
                className="flex-1 min-w-[130px] px-3 pt-2 pb-3 rounded-xl"
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: (a.avg && a.avg < 50) ? colors.statusAborder : colors.border
                }}
              >
                <View className="flex-row gap-2 justify-between items-center">
                  <AppText size="label" semibold>{a.subjectName}</AppText>
                  <View
                    className="flex-row items-center gap-1 px-3 py-1 rounded-full"
                    style={{ backgroundColor: colors.primarySoft }}
                  >
                    <TrendingUp size={14} color={colors.primary} />
                    <AppText size="subtext" semibold primary>
                      {a.avg !== null ? `${a.avg}%` : "-"}
                    </AppText>
                  </View>
                </View>
                <View
                  className="my-2"
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    opacity: 0.6,
                  }}
                />
                <View className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <Crown size={14} color={'green'} />
                    <AppText size="min" semibold>
                      {a.top ? `${capitalizeWords(a.top.name)} (${a.top.rollNo.toString().padStart(2, '0')})` : "-"}
                    </AppText>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <AlertTriangle size={14} color={'red'} />
                    <AppText size="min" muted semibold>
                      {a.low ? `${capitalizeWords(a.low.name)} (${a.low.rollNo.toString().padStart(2, '0')})` : "-"}
                    </AppText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {students.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mt-5"
          contentContainerStyle={{ paddingRight: 30 }}
        >
          <Chip active={!quickSubjectId} onPress={() => setQuickSubjectId(null)}>
            All Subjects
          </Chip>
          {setups.map((s) => (
            <Chip
              key={s.id}
              active={quickSubjectId === s.id}
              onPress={() => setQuickSubjectId(s.id)}
            >
              {getSubjectName(s.subjectId)}
            </Chip>
          ))}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView className="px-5 mt-5" keyboardShouldPersistTaps="handled">
          {students.map((stu, si) => {
            let percentSum = 0;
            let count = 0;
            setups.forEach((s) => {
              const v = marks[`${stu.uid}_${s.id}`];
              if (v == null) return;
              if (s.markingType === "marks") {
                const p = Math.round((Number(v) / Number(s.maxMarks)) * 100);
                percentSum += p;
                count++;
              }
              if (s.markingType === "grades" && GRADE_POINTS[v]) {
                percentSum += GRADE_POINTS[v];
                count++;
              }
            });
            const percent = count > 0 ? Math.round(percentSum / count) : null;
            const grade =
              percent == null
                ? "-"
                : percent >= 90
                ? "A"
                : percent >= 75
                ? "B"
                : percent >= 60
                ? "C"
                : percent >= 45
                ? "D"
                : "E";

            return (
              <View
                key={stu.uid}
                className="mb-6 rounded-2xl"
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  className="py-4 px-5 rounded-t-2xl"
                  style={{ backgroundColor: colors.primarySoft, borderBottomWidth: 1, borderColor: colors.border }}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <AppText size="body" semibold>
                        {capitalizeWords(stu.name)}
                      </AppText>
                      <AppText size="min" muted semibold>
                        App ID: {stu.appId}
                      </AppText>
                    </View>
                    <View
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <AppText semibold alwaysWhite>
                        {String(stu.rollNo).padStart(2, "0")}
                      </AppText>
                    </View>
                  </View>
                </View>
                <View className="px-5 pt-1 pb-5">
                {visibleSetups.map((s, sj) => (
                  <View
                    key={s.id}
                    className="flex-row justify-between items-center py-3 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <View>
                      <AppText semibold>{getSubjectName(s.subjectId)}</AppText>
                      {s.markingType === "marks" && (
                        <AppText size="min" muted>
                          Max Marks: {s.maxMarks}
                        </AppText>
                      )}
                    </View>
                    {s.markingType === "grades" ? (
                      <TouchableOpacity
                        disabled={locked}
                        onPress={() => setShowGradePicker({ stu, s })}
                        className="px-5 min-w-[80px] flex items-center justify-center py-2 rounded-lg border"
                        style={{ borderColor: colors.border }}
                      >
                        <AppText size="label" semibold>
                          {marks[`${stu.uid}_${s.id}`] || "Select Grade"}
                        </AppText>
                      </TouchableOpacity>
                    ) : (
                      <TextInput
                        ref={(r) => {
                          if (!r) return;
                          const index = inputOrder.current.findIndex(
                            (i) => i.stuIndex === si && i.setupId === s.id
                          );
                          if (index !== -1) {
                            inputRefs.current[index] = r;
                          }
                        }}                      
                        editable={!locked}
                        keyboardType="numeric"
                        placeholder="i.e. 35"
                        placeholderTextColor={theme == "light" ? '#ccc' : '#666'}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          const currentIndex = inputOrder.current.findIndex(
                            (i: any) => i.stuIndex === si && i.setupId === s.id
                          );
                          const nextRef = inputRefs.current[currentIndex + 1];
                          if (nextRef) {
                            requestAnimationFrame(() => {
                              nextRef.focus();
                            });
                          }
                        }}
                        className="px-4 py-2 font-semibold rounded-lg border min-w-[80px] text-center"
                        style={{
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                        value={marks[`${stu.uid}_${s.id}`]?.toString() || ""}
                        onChangeText={(v) => updateMark(stu.uid, s, v)}
                      />
                    )}
                  </View>
                ))}
                <View className="flex-row justify-between mt-4">
                  <View
                    className="px-3 py-1 rounded-lg"
                    style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}
                  >
                    <AppText semibold>
                      {grade != '-' ? 'Grade: ' : ''}{grade}
                    </AppText>
                  </View>
                  <View
                    className="px-4 py-1 rounded-lg"
                    style={{ backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }}
                  >
                    <AppText semibold primary>
                      {percent != null ? `${percent}%` : "-"}
                    </AppText>
                  </View>
                </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
      {!locked && students.length > 0 && (
        <View
          className="p-5 border-t"
          style={{ borderColor: colors.border }}
        >
          <TouchableOpacity
            onPress={saveMarks}
            className="py-4 rounded-xl flex-row justify-center items-center gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Save size={16} color="#fff" />
            <AppText semibold alwaysWhite>
              Save Marks
            </AppText>
          </TouchableOpacity>
        </View>
      )}
      <PickerModal
        visible={showClassPicker}
        title="Select Class"
        data={classData && classData}
        onClose={() => setShowClassPicker(false)}
        onSelect={(c: any) => {
          setClassId(c.id);
          setSectionId("");
        }}
      />
      <PickerModal
        visible={showSectionPicker}
        title="Select Section"
        data={classData && classData.find((c: any) => c.id === classId)?.sections || []}
        onClose={() => setShowSectionPicker(false)}
        onSelect={(s: any) => setSectionId(s.id)}
      />
      {showGradePicker && (
        <PickerModal
          visible
          title="Select Grade"
          data={GRADES.map((g) => ({ id: g, name: g }))}
          onClose={() => setShowGradePicker(null)}
          onSelect={(g: any) => {
            updateMark(showGradePicker.stu.uid, showGradePicker.s, g.id);
            setShowGradePicker(null);
          }}
        />
      )}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="w-[85%] rounded-2xl p-6"
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}
          >
            <View
              className="w-14 h-14 rounded-xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.statusAbg }}
            >
              <AlertTriangle size={26} color={colors.statusAtext} />
            </View>
            <AppText size="title" semibold>
              Discard changes?
            </AppText>
            <AppText size="subtext" muted className="mt-2" style={{ lineHeight: 20 }}>
              You have unsaved marks. If you go back now, all changes will be lost.
            </AppText>
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowDiscardModal(false)}
                className="flex-1 py-3 rounded-xl border items-center"
                style={{ borderColor: colors.border }}
              >
                <AppText semibold>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  dirtyRef.current = false;
                  setDirty(false);
                  setShowDiscardModal(false);

                  requestAnimationFrame(() => {
                    navigation.goBack();
                  });
                }}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.statusAbg }}
              >
                <AppText semibold style={{ color: colors.statusAtext }}>
                  Discard
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </Screen>
  );
}

function PickerField({ label, value, onPress, disabled }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      className="flex-1 px-4 py-3 rounded-xl border"
      style={{
        backgroundColor: colors.bgCard,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <AppText size="label" muted>
        {label}
      </AppText>
      <AppText semibold>{value || "Select"}</AppText>
    </TouchableOpacity>
  );
}

function PickerModal({ visible, onClose, title, data, onSelect }: any) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent
      onRequestClose={() => onClose()}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          className="rounded-t-3xl px-8 py-6 max-h-[70vh]"
          style={{ backgroundColor: colors.bgCard }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <ChevronRightCircle size={18} color={colors.primary} />
            <AppText size="title" semibold>
              {title}
            </AppText>
          </View>
          {data.map((i: any) => (
            <TouchableOpacity
              key={i.id}
              onPress={() => {
                onSelect(i);
                onClose();
              }}
              className="p-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <AppText semibold>{i.name}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function Chip({ children, active, onPress }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-2 mr-1.5 rounded-full border"
      style={{
        backgroundColor: active ? colors.primarySoft : colors.bgCard,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <AppText size="label" semibold style={{ color: active ? colors.primary : colors.textMuted }}>{children}</AppText>
    </TouchableOpacity>
  );
}
