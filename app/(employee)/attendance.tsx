import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import secureAxios from '@/lib/secureAxios';
import { doc, getDoc } from 'firebase/firestore';
import {
  CheckCircle,
  ChevronRightCircle,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

type StatusKey = 'P' | 'A' | 'L' | 'M';
const STUDENT_STATUS = {
  P: { label: 'P', bg: 'statusPbg', text: 'statusPtext', border: 'statusPborder' },
  A: { label: 'A', bg: 'statusAbg', text: 'statusAtext', border: 'statusAborder' },
  L: { label: 'L', bg: 'statusLbg', text: 'statusLtext', border: 'statusLborder' },
  M: { label: 'M', bg: 'statusMbg', text: 'statusMtext', border: 'statusMborder' },
};

export default function StudentAttendancePage() {
  const { schoolUser, classData } = useAuth();
  const { theme, colors } = useTheme();

  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [attendanceDocId, setAttendanceDocId] = useState('');
  const [isMarked, setIsMarked] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  const selectedClass = useMemo(
    () => classData?.find((c: any) => c.id === classId),
    [classId, classData]
  );
  const selectedSection = useMemo(
    () => selectedClass && selectedClass?.sections?.find((s: any) => s.id === sectionId),
    [sectionId, selectedClass]
  );
  const filteredClasses = useMemo(() => {
    if (!classData) return [];
    return classData.filter((c: any) => c.name.toLowerCase().includes(classSearch.toLowerCase()));
  }, [classSearch, classData]);

  async function loadStudents() {
    if (!classId || !sectionId) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields!',
        text2: 'Please select class and section.',
      });
      return;
    }
    setLoadingData(true);
    try {
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${today.getFullYear()}`;

      const docId = `student_${dateStr}_${classId}_${sectionId}`;
      setAttendanceDocId(docId);
      const rosterRef = doc(
        db,
        'schools',
        schoolUser.schoolId,
        'branches',
        schoolUser.currentBranch,
        'meta',
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
        .sort((a: any, b: any) => String(a.appId).localeCompare(String(b.appId)));
      setStudents(students);
      const attSnap = await getDoc(
        doc(
          db,
          'schools',
          schoolUser.schoolId,
          'branches',
          schoolUser.currentBranch,
          'attendance',
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
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'Failed: ' + err,
      });
    } finally {
      setLoadingData(false);
    }
  }

  function setStatus(uid: string, status: string) {
    if (isMarked) return;
    setAttendance((prev) => ({ ...prev, [uid]: status }));
  }

  function markAll(status: string) {
    if (isMarked) return;
    const updated: any = {};
    students.forEach((s) => (updated[s.uid] = status));
    setAttendance(updated);
  }

  async function saveAttendance() {
    if (!students.length || isMarked) return;
    setSaving(true);
    try {
      await secureAxios.post('/api/school/attendance/mark', {
        type: 'student',
        date: attendanceDocId.split('_')[1],
        className: classId,
        section: sectionId,
        branch: schoolUser.currentBranch,
        session: schoolUser.currentSession,
        records: attendance,
      });
      setIsMarked(true);
      Toast.show({
        type: 'success',
        text1: 'Attendance Marked!',
        text2: 'Marked successfully',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'Failed: ' + err,
      });
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo<Record<StatusKey, number>>(
    () => ({
      P: Object.values(attendance).filter((v) => v === 'P').length,
      A: Object.values(attendance).filter((v) => v === 'A').length,
      L: Object.values(attendance).filter((v) => v === 'L').length,
      M: Object.values(attendance).filter((v) => v === 'M').length,
    }),
    [attendance]
  );

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  return (
    <>
      {(loadingData || saving) && <Loading />}
      <Screen scroll={false}>
        <Header title="Attendance" />
        <ScrollView>
          <View className="mt-6 gap-4 px-5">
            <View className="gap-1 px-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <AppText semibold muted size="label">
                    Class
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setShowClassPicker(true)}
                    activeOpacity={0.85}
                    className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                    style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
                    <AppText>{selectedClass ? selectedClass.name : 'Select Class'}</AppText>
                    <AppText muted>▼</AppText>
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <AppText semibold muted size="label">
                    Section
                  </AppText>
                  <TouchableOpacity
                    disabled={!selectedClass}
                    onPress={() => setShowSectionPicker(true)}
                    activeOpacity={0.85}
                    className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: colors.bgCard,
                      borderColor: colors.border,
                      opacity: selectedClass ? 1 : 0.5,
                    }}>
                    <AppText>{selectedSection?.name ?? 'Select Section'}</AppText>
                    <AppText muted>▼</AppText>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={loadStudents}
                className="mt-3 flex-row items-center justify-center gap-2 rounded-lg py-3"
                style={{ backgroundColor: colors.primary }}>
                <Search size={15} color="#fff" />
                <AppText semibold style={{ color: '#fff' }}>
                  Load Students
                </AppText>
              </TouchableOpacity>
            </View>

            <Modal
              visible={showClassPicker}
              animationType="slide"
              transparent
              statusBarTranslucent
              onRequestClose={() => setShowClassPicker(false)}>
              <View className="flex-1 justify-end bg-black/60">
                <View
                  className="max-h-[70vh] rounded-t-3xl px-8 py-7"
                  style={{ backgroundColor: colors.bgCard }}>
                  <View className="flex-row items-center gap-2">
                    <ChevronRightCircle size={20} color={colors.primary} />
                    <AppText size="title" semibold>
                      Select Class
                    </AppText>
                  </View>
                  <TextInput
                    placeholder="Search class..."
                    placeholderTextColor={colors.textMuted}
                    className="mt-3 rounded-xl border px-5 py-3"
                    style={{ borderColor: colors.border, color: colors.text }}
                    onChangeText={setClassSearch}
                  />
                  <FlatList
                    data={filteredClasses}
                    keyExtractor={(item) => item.id}
                    className="mt-4 px-5"
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setClassId(item.id);
                          setSectionId('');
                          setStudents([]);
                          setIsMarked(false);
                          setShowClassPicker(false);
                        }}
                        className="border-b py-4"
                        style={{ borderColor: colors.border }}>
                        <AppText semibold>{item.name}</AppText>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>

            <Modal
              visible={showSectionPicker}
              animationType="slide"
              transparent
              statusBarTranslucent
              onRequestClose={() => setShowSectionPicker(false)}>
              <View className="flex-1 justify-end bg-black/60">
                <View
                  className="max-h-[70vh] rounded-t-3xl px-8 py-7"
                  style={{ backgroundColor: colors.bgCard }}>
                  <View className="flex-row items-center gap-2">
                    <ChevronRightCircle size={20} color={colors.primary} />
                    <AppText size="title" semibold>
                      Select Section
                    </AppText>
                  </View>
                  <FlatList
                    data={selectedClass && selectedClass.sections}
                    keyExtractor={(sec) => sec.id}
                    className="mt-4 px-3"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSectionId(item.id);
                          setShowSectionPicker(false);
                        }}
                        className="border-b py-4"
                        style={{ borderColor: colors.border }}>
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
                className="mx-2 items-center rounded-2xl border p-6"
                style={{
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                }}>
                <View
                  className="mb-4 h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.primarySoft }}>
                  <Users size={26} color={colors.primary} />
                </View>
                <AppText size="title" bold className="text-center">
                  Ready to mark attendance
                </AppText>
                <AppText
                  size="subtext"
                  muted
                  className="mt-2 text-center"
                  style={{ lineHeight: 20 }}>
                  Select a class and section above, then tap{' '}
                  <AppText semibold primary>
                    Load Students
                  </AppText>{' '}
                  to begin marking today’s attendance.
                </AppText>
                <View
                  className="mt-4 rounded-full px-4 py-2"
                  style={{
                    backgroundColor: colors.statusLbg,
                    borderWidth: 1,
                    borderColor: colors.statusLborder,
                  }}>
                  <AppText size="min" style={{ color: colors.statusLtext }}>
                    Tip: Attendance is locked after saving
                  </AppText>
                </View>
              </View>
            )}

            {students.length > 0 && (
              <View className="mx-3">
                <View
                  className="items-center rounded-full px-4 py-1.5"
                  style={{
                    backgroundColor: isMarked ? colors.statusPbg : colors.statusLbg,
                    borderWidth: 1,
                    borderColor: isMarked ? colors.statusPborder : colors.statusLborder,
                  }}>
                  <AppText
                    semibold
                    style={{
                      color: isMarked ? colors.statusPtext : colors.statusLtext,
                    }}>
                    {isMarked ? 'Attendance Marked' : 'Attendance Not Marked'}
                  </AppText>
                </View>
              </View>
            )}

            {students.length > 0 && !isMarked && (
              <View className="mx-3 flex-row gap-3">
                <TouchableOpacity
                  onPress={() => markAll('P')}
                  activeOpacity={0.85}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3"
                  style={{
                    backgroundColor: colors.statusPbg,
                    borderColor: colors.statusPborder,
                  }}>
                  <CheckCircle size={16} color={colors.statusPtext} />
                  <AppText semibold style={{ color: colors.statusPtext }}>
                    All Present
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => markAll('A')}
                  activeOpacity={0.85}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3"
                  style={{
                    backgroundColor: colors.statusAbg,
                    borderColor: colors.statusAborder,
                  }}>
                  <XCircle size={16} color={colors.statusAtext} />
                  <AppText semibold style={{ color: colors.statusAtext }}>
                    All Absent
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {students.length > 0 && (
              <View
                className="mx-2 gap-4 rounded-2xl border p-4"
                style={{
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                }}>
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
              {students.map((s) => (
                <View
                  key={s.uid}
                  className="mx-2 rounded-2xl border p-5"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  }}>
                  <View className="flex-row items-center gap-4">
                    <View
                      className="h-11 w-11 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primarySoft }}>
                      <AppText bold style={{ color: colors.primary }}>
                        {s.rollNo?.toString().padStart(2, '0') ?? '--'}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText size="body" bold>
                        {capitalizeWords(s.name)}
                      </AppText>
                      <AppText size="subtext" semibold muted>
                        App ID: {s.appId ?? '--'}
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
                          className="mx-1 flex-1 items-center rounded-xl border py-3"
                          style={{
                            backgroundColor: active
                              ? colors[cfg.bg as keyof typeof colors]
                              : colors.bg,
                            borderColor: active
                              ? colors[cfg.border as keyof typeof colors]
                              : colors.border,
                          }}>
                          <AppText
                            bold
                            style={{
                              color: active
                                ? colors[cfg.text as keyof typeof colors]
                                : colors.textMuted,
                            }}>
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
                className="mx-2 mb-5 mt-1 flex-row items-center justify-center gap-2 rounded-xl py-4"
                style={{
                  backgroundColor: isMarked ? colors.border : colors.primary,
                }}>
                <ShieldCheck
                  size={18}
                  color={!isMarked ? '#fff' : theme == 'light' ? '#666' : '#fff'}
                />
                <AppText
                  semibold
                  style={{ color: !isMarked ? '#fff' : theme == 'light' ? '#666' : '#fff' }}>
                  {isMarked ? 'Attendance Locked' : 'Save Attendance'}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
      className="w-[48%] rounded-xl border px-5 pb-4 pt-3"
      style={{
        backgroundColor: bg,
        borderColor: border,
      }}>
      <AppText size="heading" bold style={{ color: text }}>
        {value == 0 ? value : value.toString().padStart(2, '0')}
      </AppText>
      <View className="mt-1 flex-row items-center justify-between">
        <AppText size="subtext" semibold style={{ color: text }}>
          {label}
        </AppText>
        <AppText size="min" bold style={{ color: text }}>
          {percentage}%
        </AppText>
      </View>
      <View
        className="mt-1 h-1 overflow-hidden rounded-full"
        style={{
          backgroundColor: 'rgba(0,0,0,0.1)',
        }}>
        <View
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: text,
          }}
        />
      </View>
    </View>
  );
}
