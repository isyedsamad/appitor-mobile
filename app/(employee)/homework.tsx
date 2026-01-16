import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { hasPermission } from "@/lib/permissionUtils";
import secureAxios from "@/lib/secureAxios";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { BookOpen, Calendar, ChevronRight, Plus, Search, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, Modal, Platform, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from "react-native-toast-message";

const formatDateDMY = (date: any) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

export default function EmployeeHomeworkPage() {
  const router = useRouter();
  const { schoolUser, classData, subjectData } = useAuth();
  const { colors } = useTheme();
  const [tab, setTab] = useState<"my" | "all">("my");
  const [date, setDate] = useState(new Date());
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [homework, setHomework] = useState<any[]>([]);
  const [myHomework, setMyHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [content, setContent] = useState("");
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [timetableActive, setTimetableActive] = useState(false);
  const [DAYS_MAP, setDAYS_MAP] = useState([]);
  const [period, setPeriod] = useState(0);
  const [periodSet, setPeriodSet] = useState<number[]>([]);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [classIdSearch, setClassIdSearch] = useState('');
  const [sectionIdSearch, setSectionIdSearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClassPickerSearch, setShowClassPickerSearch] = useState(false);
  const [showSectionPickerSearch, setShowSectionPickerSearch] = useState(false);

  const selectedClassSearch = classData?.find((c: any) => c.id === classIdSearch);
  const selectedSectionSearch = selectedClassSearch?.sections?.find(
    (s: any) => s.id === sectionId
  );
  const onChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    if (Platform.OS === 'android') return;
    setShowDatePicker(Platform.OS === 'ios');
  };

  const showDatePickerDialog = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange,
        display: 'default',
      });
    } else {
      setShowDatePicker(true);
    }
  };

  {Platform.OS !== 'android' && showDatePicker && (
    <DateTimePicker
      value={date}
      mode="date"
      display="spinner"
      onChange={onChange}
      accentColor={colors.primary}
    />
  )}

  const selectedClass = classData?.find((c: any) => c.id === classId);
  const selectedSection = selectedClass?.sections?.find(
    (s: any) => s.id === sectionId
  );
  const selectedSubject = subjectData?.find(
    (s: any) => s.id === subjectId
  );

  const canCreateHomework = schoolUser ? hasPermission(schoolUser, "learning.create", false) : false;
  const getSubjectName = (id: any) =>
    subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) => classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;

  useEffect(() => {
    async function loadTimetableSettings() {
      try {
        const ref = doc(
          db,
          "schools",
          schoolUser.schoolId,
          "branches",
          schoolUser.currentBranch,
          "timetable",
          "items",
          "timetableSettings",
          "global"
        );
        const snap = await getDoc(ref);
        if(!snap.exists()) {
          Toast.show({
            type: 'error',
            text1: 'School Setup Pending',
            text2: 'Please try again later!'
          })
          router.back();
          return;
        };
        const newPeriods = [];
        for (let i = 1; i <= snap.data().totalPeriods; i++) {
          newPeriods.push(i);
        }
        setPeriodSet(newPeriods);
        setDAYS_MAP(snap.data().workingDays);
        setTimetableActive(snap.data().status === "active");
      } catch {}
    }
    loadTimetableSettings();
  }, []);

  useEffect(() => {
    if (!openAdd || !timetableActive || timetableSlots.length > 0) return;
    async function loadTeacherSlots() {
      setLoading(true);
      try {
        const ref = doc(
          db,
          "schools",
          schoolUser.schoolId,
          "branches",
          schoolUser.currentBranch,
          "timetable",
          "items",
          "teachers",
          schoolUser.uid
        );
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setTimetableSlots([]);
          return;
        }
        const today = DAYS_MAP[new Date().getDay() - 1];
        const slots = (snap.data().slots || []).filter(
          (s: any) => s.day === today
        );
        setTimetableSlots(slots);
      } finally {
        setLoading(false);
      }
    }
    loadTeacherSlots();
  }, [openAdd, timetableActive]);

  async function searchHomework(refresh: boolean) {
    if(tab == "my" && myHomework.length > 0 && !refresh) {
      setHomework(myHomework);
      return;
    }
    setLoading(true);
    try {
      let ref;
      const selectedDate = formatDateDMY(date);
      if (tab === "my") {
        ref = doc(
          db,
          "schools",
          schoolUser.schoolId,
          "branches",
          schoolUser.currentBranch,
          "learning",
          "items",
          "homework_employee",
          `${selectedDate}_${schoolUser.uid}`
        );
      } else {
        if (!classIdSearch || !sectionIdSearch) {
          Toast.show({
            type: "error",
            text1: "Select Class & Section",
            text2: 'Please select class and section to continue!'
          });
          return;
        }
        ref = doc(
          db,
          "schools",
          schoolUser.schoolId,
          "branches",
          schoolUser.currentBranch,
          "learning",
          "items",
          "homework",
          `${classIdSearch}_${sectionIdSearch}_${selectedDate}`
        );
      }
      const snap = await getDoc(ref);
      setHomework(snap.exists() ? snap.data().items || [] : []);
      if(tab == "my") setMyHomework(snap.exists() ? snap.data().items || [] : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if(tab == "my") searchHomework(false);
    else setHomework([]);
  }, [tab]);

  useEffect(() => {
    setHomework([]);
  }, [date])

  async function saveHomework() {
    if (!canCreateHomework) {
      Toast.show({
        type: "error",
        text1: "Permission denied",
        text2: "You are not allowed to add homework",
      });
      return;
    }
    if (!content.trim()) {
      Toast.show({ type: "error", text1: "Homework Missing", text2: 'Please enter homework to continue!' });
      return;
    }
    if (timetableActive && !selectedSlot) {
      Toast.show({ type: "error", text1: "Select period" });
      return;
    }
    if(!timetableActive && (!period || !classId || !subjectId || !sectionId)) {
      Toast.show({ type: "error", text1: "Missing Fields", text2: 'Please select all the required fields!' });
      return;
    }
    setLoading(true);
    const selectedDate = formatDateDMY(date);
    try {
      await secureAxios.post("/api/school/learning/homework", {
        branch: schoolUser.currentBranch,
        date: selectedDate,
        content,
        classId: !timetableActive ? classId : undefined,
        sectionId: !timetableActive ? sectionId : undefined,
        timetable: timetableActive ? selectedSlot : {
          period: period,
          classId,
          sectionId,
          subjectId,
          teacherId: schoolUser.uid,
        },
      });
      Toast.show({ type: "success", text1: "Homework Updated", text2: 'homework saved successfully!' });
      setOpenAdd(false);
      setContent("");
      setSelectedSlot(null);
      searchHomework(true);
    } catch(err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to save homework!",
        text2: 'Error: ' + err.response.data.message
      });
    } finally {
      setLoading(false);
    }
  }

  if(loading) return <Loading />

  return (
    <>
      <Screen scroll={false}>
      <Header
        title="Homework"
        rightSlot={
          canCreateHomework ? (
            <TouchableOpacity
              onPress={() => setOpenAdd(true)}
              className="p-2 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Plus size={20} color='#fff' />
            </TouchableOpacity>
          ) : null
        }
      />
        <View
          className="flex-row mx-5 mt-4 p-1 rounded-2xl border"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.bgCard,
          }}
        >
          <TouchableOpacity
            onPress={() => setTab("my")}
            className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
            style={{
              backgroundColor: tab === "my" ? colors.primarySoft : "transparent",
            }}
          >
            <BookOpen
              size={14}
              color={tab === "my" ? colors.primary : colors.textMuted}
            />
            <AppText
              size="label"
              semibold
              style={{
                color: tab === "my" ? colors.primary : colors.textMuted,
              }}
            >
              My Homework
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab("all")}
            className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
            style={{
              backgroundColor: tab === "all" ? colors.primarySoft : "transparent",
            }}
          >
            <Users
              size={14}
              color={tab === "all" ? colors.primary : colors.textMuted}
            />
            <AppText
              size="label"
              semibold
              style={{
                color: tab === "all" ? colors.primary : colors.textMuted,
              }}
            >
              All Homework
            </AppText>
          </TouchableOpacity>
        </View>
        <View
          className="mx-7 mt-5 gap-3"
        >
          <View>
            <AppText size="label" muted>Date</AppText>
            <TouchableOpacity
              onPress={showDatePickerDialog}
              activeOpacity={0.85}
              className="px-4 py-3 rounded-xl border flex-row justify-between items-center"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              }}
            >
              <AppText semibold>{date.toLocaleDateString('en-IN', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}</AppText>
              <Calendar size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {tab === "all" && (
            <View className="flex-row justify-center items-center gap-4">
              <View className="flex-1">
                <AppText size="label" muted>Class</AppText>
                <TouchableOpacity
                  onPress={() => setShowClassPickerSearch(true)}
                  activeOpacity={0.85}
                  className="px-4 py-3 rounded-xl border flex-row justify-between items-center"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  }}
                >
                  <AppText semibold>
                    {classIdSearch ? getClassName(classIdSearch) : "Select class"}
                  </AppText>
                  <AppText muted>▼</AppText>
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <AppText size="label" muted>Section</AppText>
                <TouchableOpacity
                  disabled={!classIdSearch}
                  onPress={() => setShowSectionPickerSearch(true)}
                  activeOpacity={0.85}
                  className="px-4 py-3 rounded-xl border flex-row justify-between items-center"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                    opacity: classIdSearch ? 1 : 0.5,
                  }}
                >
                  <AppText semibold>
                    {sectionIdSearch ? getSection(classIdSearch, sectionIdSearch) : "Select section"}
                  </AppText>
                  <AppText muted>▼</AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => searchHomework(true)}
            className="mt-1 py-3 rounded-xl flex-row justify-center gap-3 items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Search size={15} color={'#fff'} />
            <AppText semibold style={{ color: "#fff" }}>
              Search Homework
            </AppText>
          </TouchableOpacity>
        </View>

        <Modal visible={showClassPickerSearch} statusBarTranslucent transparent animationType="slide" onRequestClose={() => setShowClassPickerSearch(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="rounded-t-3xl px-6 py-6"
              style={{ backgroundColor: colors.bgCard }}
            >
              <View className="flex-row items-center gap-2">
                <ChevronRight size={20} color={colors.text} />
                <AppText size="title" semibold>Select Class</AppText>
              </View>
              <FlatList
                data={classData}
                keyExtractor={(c: any) => c.id}
                className="mt-4"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setClassIdSearch(item.id);
                      setSectionIdSearch('');
                      setShowClassPickerSearch(false);
                    }}
                    className="py-4 px-5 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <AppText semibold>{item.name}</AppText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showSectionPickerSearch} statusBarTranslucent transparent animationType="slide"
          onRequestClose={() => setShowSectionPickerSearch(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="rounded-t-3xl px-6 py-6"
              style={{ backgroundColor: colors.bgCard }}
            >
              <View className="flex-row items-center gap-2">
                <ChevronRight size={20} color={colors.text} /> 
                <AppText size="title" semibold>Select Section</AppText>
              </View>
              <FlatList
                data={selectedClassSearch?.sections || []}
                keyExtractor={(s: any) => s.id}
                className="mt-4"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSectionIdSearch(item.id);
                      setShowSectionPickerSearch(false);
                    }}
                    className="py-4 px-5 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <AppText semibold>{item.name}</AppText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <View className="mt-6 px-5 flex-1">
          {homework.length === 0 ? (
            <View className="items-center py-16">
              <BookOpen size={32} color={colors.textMuted} />
              <AppText muted className="mt-3">
                No homework found!
              </AppText>
            </View>
          ) : (
            <FlatList
              data={homework}
              scrollEnabled={false}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ gap: 12, flexGrow: 1 }}
              style={{ flex: 1, marginBottom: 20 }}
              renderItem={({ item }) => (
                <View
                  className="p-5 rounded-2xl border"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="px-3 h-11 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.primarySoft }}
                    >
                      <AppText bold style={{ color: colors.primary }}>
                        {getClassName(item.classId)} {getSection(item.classId, item.sectionId)}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText size="body" semibold>
                        {getSubjectName(item.subjectId)}
                      </AppText>
                      <AppText size="subtext" muted>
                        Period: {item.period.toString().padStart(2, '0')}
                      </AppText>
                    </View>
                  </View>
                  <View
                    className="my-4"
                    style={{ height: 1, backgroundColor: colors.border, opacity: 0.6 }}
                  />
                  <AppText style={{ lineHeight: 22 }}>
                    {item.content}
                  </AppText>
                </View>
              )}
            />
          )}
        </View>

        <Modal
          visible={openAdd}
          transparent
          statusBarTranslucent={true}
          animationType="slide"
          onRequestClose={() => setOpenAdd(false)}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="rounded-t-3xl px-8 pt-6 pb-6"
              style={{ backgroundColor: colors.bgCard }}
            >
              <View className="flex-row mb-4 items-center gap-3">
                <Plus size={20} color={colors.text} /> 
                <AppText size="title" semibold>Homework</AppText>
              </View>
              <View
                className="mb-3"
                style={{ height: 1, backgroundColor: colors.border }}
              />
              {timetableActive ? (
                <>
                  <View className="mb-3">
                    <AppText size="label" semibold>
                      Today’s Teaching Slots
                    </AppText>
                    <AppText size="subtext" muted>
                      Select a class & subject you taught today
                    </AppText>
                  </View>
                  <View className="gap-3">
                    {timetableSlots.length === 0 && (
                      <View
                        className="p-4 rounded-xl border"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        }}
                      >
                        <AppText muted>
                          No timetable found for today
                        </AppText>
                      </View>
                    )}

                    {timetableSlots.map((s, i) => {
                      const active = selectedSlot === s;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedSlot(s)}
                          activeOpacity={0.85}
                          className="p-4 rounded-2xl border"
                          style={{
                            backgroundColor: active
                              ? colors.primarySoft
                              : colors.bg,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                          }}
                        >
                          <View className="flex-row items-center gap-4">
                            <View
                              className="w-10 h-10 rounded-xl items-center justify-center"
                              style={{ backgroundColor: colors.bgCard }}
                            >
                              <AppText bold style={{ color: colors.primary }}>
                                {getClassName(s.classId)} {getSection(s.classId, s.sectionId)}
                              </AppText>
                            </View>
                            <View className="flex-1">
                              <AppText bold>
                                {getSubjectName(s.subjectId)}
                              </AppText>
                              <AppText size="min" semibold muted>
                                Period: P{s.period}
                              </AppText>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  <View className="mb-4">
                    <AppText size="label" semibold>
                      Class & Subject
                    </AppText>
                    <AppText size="subtext" muted>
                      Select where this homework applies
                    </AppText>
                  </View>
                  <View className="gap-3">
                    <View>
                      <AppText size="label" muted>Class</AppText>
                      <TouchableOpacity
                        onPress={() => setShowClassPicker(true)}
                        activeOpacity={0.85}
                        className="mt-1 px-4 py-3 rounded-xl border flex-row justify-between items-center"
                        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                      >
                        <AppText semibold>
                          {selectedClass ? selectedClass.name : "Select Class"}
                        </AppText>
                        <AppText muted>▼</AppText>
                      </TouchableOpacity>
                    </View>
                    <View>
                      <AppText size="label" muted>Section</AppText>
                      <TouchableOpacity
                        disabled={!classId}
                        onPress={() => setShowSectionPicker(true)}
                        activeOpacity={0.85}
                        className="mt-1 px-4 py-3 rounded-xl border flex-row justify-between items-center"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          opacity: classId ? 1 : 0.5,
                        }}
                      >
                        <AppText semibold>
                          {selectedSection ? selectedSection.name : "Select Section"}
                        </AppText>
                        <AppText muted>▼</AppText>
                      </TouchableOpacity>
                    </View>
                    <View>
                      <AppText size="label" muted>Period</AppText>
                      <TouchableOpacity
                        onPress={() => setShowPeriodPicker(true)}
                        activeOpacity={0.85}
                        className="mt-1 px-4 py-3 rounded-xl border flex-row justify-between items-center"
                        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                      >
                        <AppText semibold>
                          {period ? 'P' + period : "Select Period"}
                        </AppText>
                        <AppText muted>▼</AppText>
                      </TouchableOpacity>
                    </View>
                    <View>
                      <AppText size="label" muted>Subject</AppText>
                      <TouchableOpacity
                        onPress={() => setShowSubjectPicker(true)}
                        activeOpacity={0.85}
                        className="mt-1 px-4 py-3 rounded-xl border flex-row justify-between items-center"
                        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                      >
                        <AppText semibold>
                          {selectedSubject ? selectedSubject.name : "Select Subject"}
                        </AppText>
                        <AppText muted>▼</AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
              <View className="mt-6">
                <AppText size="label" semibold>
                  Homework Details
                </AppText>
                <TextInput
                  placeholder="Write homework instructions here…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={content}
                  onChangeText={setContent}
                  className="mt-2 px-4 py-4 rounded-2xl border"
                  style={{
                    minHeight: 80,
                    borderColor: colors.border,
                    color: colors.text,
                    textAlignVertical: "top",
                  }}
                />
              </View>
              <TouchableOpacity
                onPress={saveHomework}
                activeOpacity={0.9}
                className="mt-6 py-4 rounded-2xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <AppText semibold style={{ color: "#fff" }}>
                  Save Homework
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showClassPicker} statusBarTranslucent={true} transparent animationType="slide" onRequestClose={() => setShowClassPicker(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="rounded-t-3xl py-6 px-6"
              style={{ backgroundColor: colors.bgCard, borderWidth: 3, borderColor: colors.border }}
            >
              <View className="flex-row items-center gap-2">
                <ChevronRight size={20} color={colors.text} /> 
                <AppText size="title" semibold>Select Class</AppText>
              </View>
              <FlatList
                data={classData}
                keyExtractor={(c: any) => c.id}
                className="mt-4"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setClassId(item.id);
                      setSectionId("");
                      setShowClassPicker(false);
                    }} key={item}
                    className="py-4 px-5 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <AppText semibold>{item.name}</AppText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showSectionPicker} statusBarTranslucent={true} transparent animationType="slide" onRequestClose={() => setShowSectionPicker(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="rounded-t-3xl py-6 px-6"
              style={{ backgroundColor: colors.bgCard }}
            >
              <View className="flex-row items-center gap-2">
                <ChevronRight size={20} color={colors.text} /> 
                <AppText size="title" semibold>Select Section</AppText>
              </View>
              <FlatList
                data={selectedClass?.sections || []}
                keyExtractor={(s: any) => s.id}
                className="mt-4"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSectionId(item.id);
                      setShowSectionPicker(false);
                    }}
                    className="py-4 px-5 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <AppText semibold>{item.name}</AppText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showPeriodPicker} statusBarTranslucent={true} transparent animationType="slide" onRequestClose={() => setShowPeriodPicker(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="rounded-t-3xl py-6 px-6"
              style={{ backgroundColor: colors.bgCard }}
            >
              <View className="flex-row items-center gap-2">
                <ChevronRight size={20} color={colors.text} /> 
                <AppText size="title" semibold>Select Period</AppText>
              </View>
              <FlatList
                data={periodSet}
                keyExtractor={(s: any) => s.id}
                className="mt-4"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      setPeriod(item);
                      setShowPeriodPicker(false);
                    }}
                    className="py-4 px-5 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <AppText semibold>P{item}</AppText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Modal visible={showSubjectPicker} statusBarTranslucent={true} transparent animationType="slide" onRequestClose={() => setShowSubjectPicker(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="rounded-t-3xl py-6 px-6"
              style={{ backgroundColor: colors.bgCard }}
            >
              <View className="flex-row items-center gap-2">
                <ChevronRight size={20} color={colors.text} /> 
                <AppText size="title" semibold>Select Subject</AppText>
              </View>
              <FlatList
                data={subjectData}
                keyExtractor={(s: any) => s.id}
                className="mt-4"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSubjectId(item.id);
                      setShowSubjectPicker(false);
                    }}
                    className="py-4 px-5 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <AppText semibold>{item.name}</AppText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

      </Screen>
    </>
  );
}
