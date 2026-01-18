import { Header } from "@/components/employee/Header";
import { AppText } from "@/components/ui/AppText";
import Loading from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { doc, getDoc } from "firebase/firestore";
import { BookOpen, Calendar, ChevronRightCircle, Search, Users } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const buildTimeline = (settings: any) => {
  let cursor = timeToMinutes(settings.startTime);
  const map: any = {};
  const breaks = settings.breaks || [];
  for (let p = 1; p <= settings.totalPeriods; p++) {
    const start = cursor;
    cursor += settings.periodDuration;
    map[p] = { start, end: cursor };
    const br = breaks.find((b: any) => b.afterPeriod === p);
    if (br) cursor += br.duration;
  }
  return map;
};

const isNow = (start: number, end: number) => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= start && mins <= end;
};

function buildRows(slots: any[], settings: any) {
  const rows: any[] = [];
  for (let p = 1; p <= settings.totalPeriods; p++) {
    const slot = slots.find(s => s.period === p);
    if (slot) {
      rows.push({ type: "period", slot });
    }
    const br = settings.breaks?.find((b: any) => b.afterPeriod === p);
    if (br) {
      rows.push({ type: "break", ...br });
    }
  }
  return rows;
}

export default function EmployeeTimetablePage() {
  const { schoolUser, classData, subjectData, employeeData } = useAuth();
  const { colors } = useTheme();

  const [settings, setSettings] = useState<any>(null);
  const [teacherSlots, setTeacherSlots] = useState<any[]>([]);
  const [classSlots, setClassSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"my" | "class">("my");
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(new Date());

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);

  const dayCode = DAY_CODES[date.getDay()];
  const getTeacherName = (id: any) =>
    employeeData.find((t: any) => t.id === id)?.name;
  const getSubjectName = (id: any) =>
    subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) => classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;

  useEffect(() => {
    async function init() {
      try {
        const ref = doc(
          db,
          "schools", schoolUser.schoolId,
          "branches", schoolUser.currentBranch,
          "timetable", "items", "timetableSettings", "global"
        );
        const snap = await getDoc(ref);

        if (!snap.exists() || snap.data().status !== "active") {
          Toast.show({ type: "info", text1: "Timetable not active" });
          return;
        }
        setSettings(snap.data());
        const tRef = doc(
          db,
          "schools", schoolUser.schoolId,
          "branches", schoolUser.currentBranch,
          "timetable", "items", "teachers", schoolUser.uid
        );
        const tSnap = await getDoc(tRef);
        setTeacherSlots(
          tSnap.exists()
            ? (tSnap.data().slots || []).map((slot: any) => ({
                ...slot,
                teacherId: schoolUser.uid
              }))
            : []
        );
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadClassTimetable() {
    if (!classId || !sectionId) {
      Toast.show({ type: "error", text1: "Select class & section" });
      return;
    }
    setLoading(true);
    try {
      const ref = doc(
        db,
        "schools", schoolUser.schoolId,
        "branches", schoolUser.currentBranch,
        "timetable", "items", "classes",
        `${classId}_${sectionId}`
      );
      const snap = await getDoc(ref);
      const entries =
        snap.exists() && snap.data().days?.[dayCode]
          ? Object.values(snap.data().days[dayCode])
              .flatMap((periodObj: any) =>
                (periodObj.entries || []).map((entry: any) => ({
                  ...entry,
                  period: periodObj.period,
                  classId,
                  sectionId
                }))
              )
          : [];
      setClassSlots(entries);
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo(
    () => (settings ? buildTimeline(settings) : {}),
    [settings]
  );
  
  const classDayRows = useMemo(
    () => (settings ? buildRows(classSlots, settings) : []),
    [classSlots, settings]
  );

  const myDay = teacherSlots
    .filter(s => s.day === dayCode)
    .sort((a, b) => a.period - b.period);

  const myDayRows = useMemo(
    () => (settings ? buildRows(myDay, settings) : []),
    [myDay, settings]
  );

  const myWeek = settings?.workingDays.map((d: string) => ({
    day: d,
    slots: teacherSlots.filter(s => s.day === d).sort((a, b) => a.period - b.period),
  })) || [];

  const openDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        onChange: (_, d) => d && setDate(d),
      });
    }
  };

  const listData =
    tab === "my"
      ? view === "day"
        ? myDayRows
        : myWeek
      : classDayRows;

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Header title="Timetable" />
      <ScrollView>
      <View
        className="mx-5 mt-4 rounded-full"
        style={{
          backgroundColor: colors.bgCard,
          padding: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View className="flex-row">
          {[{ key: "my", label: "My Timetable", icon: BookOpen },
            { key: "class", label: "Class", icon: Users }].map(
            ({ key, label, icon: Icon }: any, index: number) => {
              const isActive = tab === key;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTab(key)}
                  className="flex-1 flex-row items-center justify-center"
                  activeOpacity={0.9}
                  style={{
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: isActive ? colors.primarySoft : "transparent",
                  }}
                >
                  <Icon
                    size={16}
                    color={isActive ? colors.primary : colors.textMuted}
                  />
                  <AppText
                    size="label"
                    semibold
                    alwaysWhite={isActive}
                    style={{
                      marginLeft: 6,
                      letterSpacing: 0.3,
                      color: isActive ? colors.primary : colors.textMuted,
                    }}
                  >
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </View>
      {(view != "week" || tab == "class") && (
        <View className="mx-7 mt-4">
          <AppText size="label">Date</AppText>
          <TouchableOpacity onPress={openDatePicker}
            className="px-4 py-3 mt-1 rounded-xl border flex-row justify-between"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
            <AppText>{date.toDateString()}</AppText>
            <Calendar size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      {tab === "my" && (
        <View className="flex-row mx-7 mt-3 gap-2">
          {["day", "week"].map(v => (
            <TouchableOpacity key={v}
              onPress={() => setView(v as any)}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: view === v ? colors.primary : colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                {view === v ? (
                  <AppText size="label" semibold alwaysWhite>{v.toUpperCase()}</AppText>
                ) : (
                  <AppText size="label" semibold>{v.toUpperCase()}</AppText>
                )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      {tab === "class" && (
        <>
          <View className="flex-row mx-7 mt-3 gap-4">
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
            onPress={loadClassTimetable}
            className="mx-7 mt-4 py-3 rounded-xl items-center flex-row justify-center gap-2"
            style={{ backgroundColor: colors.primary }}>
              <Search size={17} color={'#fff'} />
              <AppText semibold style={{ color: "#fff" }}>
                View Timetable
              </AppText>
          </TouchableOpacity>
        </>
      )}
      <View className="flex-1 px-5 mt-6">
        <FlatList
          data={listData}
          keyExtractor={(_, i) => String(i)}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 30 }}
          renderItem={({ item }) => {
              if (!listData || (listData.length === 1 && item?.type == "break")) return null;
              if (item?.type === "break") {
                return <BreakRow breakItem={item} />;
              }
              if(view === "week" && tab === "my") { 
                return (
                  <View className="gap-3 mt-1">
                    <View className="py-2 px-4 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }}>
                      <AppText semibold primary>{item.day}</AppText>
                    </View>
                    {item.slots.map((s: any) => (
                      <PeriodCard key={s.period} slot={s} timeline={timeline} />
                    ))}
                  </View>
                )
              }
              return <PeriodCard slot={item.slot ?? item} timeline={timeline} />;
            }
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <AppText muted>No timetable found</AppText>
            </View>
          }
        />
      </View>
      <PickerModal
        visible={showClassPicker}
        onClose={() => setShowClassPicker(false)}
        title="Select Class"
        data={classData}
        onSelect={(c: any) => {
          setClassId(c.id);
          setSectionId("");
        }}
      />
      <PickerModal
        visible={showSectionPicker}
        onClose={() => setShowSectionPicker(false)}
        title="Select Section"
        data={classData.find((c: any) => c.id === classId)?.sections || []}
        onSelect={(s: any) => setSectionId(s.id)}
      />
      </ScrollView>
    </Screen>
  );
}

function PeriodCard({ slot, timeline }: any) {
  const { colors } = useTheme();
  const { classData, employeeData, subjectData } = useAuth();
  const time = timeline[slot.period];
  const active = slot.day && isNow(time.start, time.end);
  const getTeacherName = (id: any) =>
    employeeData.find((t: any) => t.uid === id)?.name;
  const getSubjectName = (id: any) =>
    subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) => classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;
  const capitalizeWords = (str: string) => {
    if(!str) return; 
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
  }
  return (
    <View
      className="flex-row items-start gap-4 p-4 rounded-2xl border"
      style={{
        backgroundColor: active ? colors.primarySoft : colors.bgCard,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <View
        className="w-12 h-14 rounded-xl items-center justify-center"
        style={{ backgroundColor: active ? colors.primary : colors.primarySoft }}
      >
        <AppText semibold style={{ color: active ? '#fff' : colors.primary }}>
          P{slot.period}
        </AppText>
      </View>
      <View className="flex-1">
        <AppText size="body" semibold>
          {getClassName(slot.classId)} {getSection(slot.classId, slot.sectionId)} -{" "}
          {getSubjectName(slot.subjectId)}
        </AppText>
        <AppText size="subtext" muted semibold>
          {capitalizeWords(getTeacherName(slot.teacherId))}
        </AppText>
        <AppText size="min" muted semibold>
          {minutesToTime(time.start)} – {minutesToTime(time.end)}
        </AppText>
      </View>
    </View>
  );
}

function BreakRow({ breakItem }: any) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-4 px-4 py-4 rounded-2xl justify-center"
      style={{ backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }}>
      <AppText size="label" muted semibold primary>
        {breakItem.label} - {breakItem.duration} mins
      </AppText>
    </View>
  );
}


function PickerModal({ visible, onClose, title, data, onSelect }: any) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose()}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-3xl p-7 max-h-[70vh]"
          style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center gap-2">
              <ChevronRightCircle size={18} color={colors.primary} />
              <AppText size="title" semibold>{title}</AppText>
            </View>
            <FlatList
              data={data}
              className="mt-3"
              keyExtractor={(i: any) => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="py-4 px-5 border-b"
                  style={{ borderColor: colors.border }}>
                  <AppText semibold>{item.name}</AppText>
                </TouchableOpacity>
              )}
            />
        </View>
      </View>
    </Modal>
  );
}
