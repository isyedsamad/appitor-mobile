'use client';

import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { hasPermission } from '@/lib/permissionUtils';
import secureAxios from '@/lib/secureAxios';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  BookOpen,
  Calendar,
  CalendarClock,
  ChevronRightCircle,
  Plus,
  PlusCircle,
  Search,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

function formatDueDate(ts: any) {
  if (!ts) return '-';
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(ts: any) {
  if (!ts) return false;
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return d.getTime() < Date.now();
}

export default function EmployeeAssignmentPage() {
  const { schoolUser, classData, subjectData, employeeData } = useAuth();
  const { colors } = useTheme();
  const canCreate = hasPermission(schoolUser, 'learning.create', false);
  const canDelete = hasPermission(schoolUser, 'learning.all', false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [sessionId, setSessionId] = useState(schoolUser?.currentSession || '');
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [assignments, setAssignments] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [teacherMappings, setTeacherMappings] = useState<any[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    subjectId: '',
  });

  const selectedClass = useMemo(
    () => classData?.find((c: any) => c.id === classId),
    [classId, classData]
  );

  const getSection = (cid: any, sid: any) =>
    classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const ref = doc(db, 'schools', schoolUser.schoolId, 'settings', 'academic');
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        setSessionList(snap.data().sessions || []);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Sessions',
          text2: 'Error: ' + err,
        });
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  async function loadTeacherMappings() {
    setLoading(true);
    try {
      const ref = collection(
        db,
        'schools',
        schoolUser.schoolId,
        'branches',
        schoolUser.currentBranch,
        'timetable',
        'items',
        'subjectTeacherMapping'
      );
      const q = query(ref, where('teacherId', '==', schoolUser.uid));
      const snap = await getDocs(q);
      if (snap.empty) {
        setTeacherMappings([]);
        return;
      }
      const mapping = snap.docs.map((m: any) => ({ id: m.id, ...m.data() }));
      console.log(mapping);
      setTeacherMappings(mapping);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Timetable',
        text2: 'Error: ' + err,
      });
    } finally {
      setLoading(false);
    }
  }

  async function searchAssignments() {
    if (!sessionId || !classId || !sectionId) {
      Toast.show({
        type: 'error',
        text1: 'Missing filters',
        text2: 'Select session, class and section',
      });
      return;
    }
    setLoading(true);
    try {
      const ref = doc(
        db,
        'schools',
        schoolUser.schoolId,
        'branches',
        schoolUser.currentBranch,
        'learning',
        'items',
        'assignments',
        `${classId}_${sectionId}_${sessionId}`
      );
      const snap = await getDoc(ref);
      setAssignments(snap.exists() ? snap.data().items || [] : []);
    } finally {
      setLoading(false);
    }
  }

  async function saveAssignment() {
    if (!canCreate) {
      Toast.show({
        type: 'error',
        text1: 'Permission denied',
      });
      return;
    }
    if (!form.title || !selectedMapping.classId) {
      Toast.show({
        type: 'error',
        text1: 'Required fields missing',
      });
      return;
    }
    setLoading(true);
    try {
      await secureAxios.post('/api/school/learning/assignments', {
        branch: schoolUser.currentBranch,
        sessionId: schoolUser.currentSession,
        classId: selectedMapping.classId,
        sectionId: selectedMapping.sectionId,
        subjectId: selectedMapping.subjectId,
        teacherId: schoolUser.uid,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
      });
      Toast.show({
        type: 'success',
        text1: 'Assignment created',
        text2: 'task published! students can now access it.',
      });
      setOpenAdd(false);
      setForm({ title: '', description: '', dueDate: '', subjectId: '' });
      searchAssignments();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: err?.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAssignment(assignmentId: string) {
    setLoading(true);
    try {
      await secureAxios.delete('/api/school/learning/assignments', {
        data: {
          branch: schoolUser.currentBranch,
          sessionId,
          classId,
          sectionId,
          assignmentId,
        },
      });
      Toast.show({
        type: 'success',
        text1: 'Assignment deleted',
        text2: 'successfully removed from the course',
      });
      searchAssignments();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Delete',
        text2: 'Error: ' + err.respose.data.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const onDueDateChange = (_: any, selected?: Date) => {
    const d = selected || dueDate;
    setDueDate(d);
    setForm((f: any) => ({
      ...f,
      dueDate: d?.toISOString().slice(0, 10),
    }));
    if (Platform.OS !== 'android') setShowDatePicker(false);
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dueDate || new Date(),
        mode: 'date',
        onChange: onDueDateChange,
      });
    } else {
      setShowDatePicker(true);
    }
  };

  useEffect(() => {
    if (openAdd) {
      if (teacherMappings.length == 0) loadTeacherMappings();
    }
  }, [openAdd]);

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    if (filter === 'all') return assignments;
    return assignments.filter((a) => {
      const expired = isExpired(a.dueDate);
      return filter === 'past' ? expired : !expired;
    });
  }, [assignments, filter]);

  if (loading) return <Loading />;

  return (
    <>
      <Screen scroll={false}>
        <Header
          title="Assignments"
          rightSlot={
            canCreate ? (
              <TouchableOpacity
                onPress={() => setOpenAdd(true)}
                className="rounded-xl p-2"
                style={{ backgroundColor: colors.primary }}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />
        <ScrollView>
          <View className="mt-5">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 7 }}
              data={sessionList || []}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => {
                const active = sessionId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSessionId(item.id);
                      setAssignments(null);
                    }}
                    className="rounded-full border px-4 py-2"
                    style={{
                      backgroundColor: active ? colors.primarySoft : colors.bgCard,
                      borderColor: active ? colors.primary : colors.border,
                    }}>
                    <AppText
                      size="label"
                      semibold
                      style={{ color: active ? colors.primary : colors.textMuted }}>
                      {item.id}
                    </AppText>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <View className="mx-7 mt-5 gap-4">
            <View className="flex flex-row items-center justify-center gap-4">
              <View className="flex-1">
                <AppText size="label" muted>
                  Class
                </AppText>
                <TouchableOpacity
                  onPress={() => setShowClassPicker(true)}
                  className="mt-1 rounded-xl border px-4 py-3"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
                  <AppText semibold>{selectedClass?.name || 'Select Class'}</AppText>
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <AppText size="label" muted>
                  Section
                </AppText>
                <TouchableOpacity
                  disabled={!classId}
                  onPress={() => setShowSectionPicker(true)}
                  className="mt-1 rounded-xl border px-4 py-3"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
                  <AppText semibold>{getSection(classId, sectionId) || 'Select Section'}</AppText>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              onPress={searchAssignments}
              className="flex-row items-center justify-center gap-2 rounded-xl py-3"
              style={{ backgroundColor: colors.primary }}>
              <Search size={16} color="#fff" />
              <AppText semibold style={{ color: '#fff' }}>
                Search Assignments
              </AppText>
            </TouchableOpacity>
          </View>

          <View
            className="mx-5 mt-4 flex-row rounded-2xl border p-1"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bgCard,
            }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past' },
            ].map((t) => {
              const active = filter === t.key;

              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setFilter(t.key as any)}
                  className="flex-1 items-center rounded-xl py-2"
                  style={{
                    backgroundColor: active ? colors.primarySoft : 'transparent',
                  }}>
                  <AppText
                    size="label"
                    semibold
                    style={{
                      color: active ? colors.primary : colors.textMuted,
                    }}>
                    {t.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <FlatList
            data={filteredAssignments}
            scrollEnabled={false}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            ListEmptyComponent={
              assignments && (
                <View className="items-center py-20">
                  <BookOpen size={32} color={colors.textMuted} />
                  <AppText muted className="mt-3">
                    No assignments found
                  </AppText>
                </View>
              )
            }
            renderItem={({ item }) => {
              const expired = isExpired(item.dueDate);
              const isOwner = item.createdBy === schoolUser.uid;
              return (
                <View
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  }}>
                  <View
                    className="flex-row items-start justify-between px-5 py-4"
                    style={{
                      backgroundColor: colors.bg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}>
                    <View className="flex-1 pr-3">
                      <AppText size="body" semibold>
                        {item.title}
                      </AppText>
                      <AppText size="subtext" muted className="mt-0.5">
                        {subjectData.find((s: any) => s.id === item.subjectId)?.name}
                      </AppText>
                    </View>
                    <View
                      className="rounded-full border px-3 py-1"
                      style={{
                        backgroundColor: expired ? colors.statusAbg : colors.statusPbg,
                        borderColor: expired ? colors.statusAborder : colors.statusPborder,
                      }}>
                      <AppText
                        size="min"
                        semibold
                        style={{
                          color: expired ? colors.statusAtext : colors.statusPtext,
                        }}>
                        {expired ? 'Past' : 'Upcoming'}
                      </AppText>
                    </View>
                  </View>
                  <View className="gap-3 px-5 py-4">
                    <View className="flex-row items-center gap-2">
                      <CalendarClock size={14} color={colors.textMuted} />
                      <AppText size="subtext" muted semibold>
                        Due {formatDueDate(item.dueDate)}
                      </AppText>
                    </View>
                    {item.description ? (
                      <AppText size="label" style={{ lineHeight: 18 }}>
                        {item.description}
                      </AppText>
                    ) : (
                      <AppText size="subtext" muted>
                        No description provided
                      </AppText>
                    )}
                  </View>
                  <View
                    className="flex-row items-center justify-between px-6 py-3"
                    style={{
                      borderTopWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                    }}>
                    <View
                      className="rounded-lg px-3 py-1"
                      style={{
                        backgroundColor: colors.bgCard,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <AppText size="subtext" muted semibold>
                        {capitalizeWords(
                          employeeData.find((t: any) => t.uid === item.createdBy)?.name || ''
                        )}
                      </AppText>
                    </View>
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => setDeleteTarget(item)}
                        className="rounded-full p-2"
                        style={{ backgroundColor: colors.dangerSoft }}>
                        <Trash2 size={14} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />

          <Modal
            visible={openAdd}
            transparent
            statusBarTranslucent
            animationType="slide"
            onRequestClose={() => setOpenAdd(false)}>
            <View className="flex-1 justify-end bg-black/60">
              <View className="rounded-t-3xl px-8 pt-6" style={{ backgroundColor: colors.bgCard }}>
                <View className="flex-row items-center gap-3 pb-4">
                  <PlusCircle size={20} color={colors.primary} />
                  <AppText size="title" semibold>
                    Add Assignment
                  </AppText>
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  className="max-h-[75vh]">
                  <View style={{ height: 1, backgroundColor: colors.border }} className="mb-4" />
                  <View className="mb-4">
                    <AppText size="label" semibold>
                      Your Classes & Subjects
                    </AppText>
                    <AppText size="subtext" muted>
                      Select where you want to view assignments
                    </AppText>
                    <View className="mt-3 gap-2">
                      {teacherMappings.map((m, i) => {
                        const active =
                          selectedMapping?.classId === m.classId &&
                          selectedMapping?.sectionId === m.sectionId &&
                          selectedMapping?.subjectId === m.subjectId;
                        return (
                          <TouchableOpacity
                            key={i}
                            onPress={() => {
                              setSelectedMapping(m);
                              setClassId(m.classId);
                              setSectionId(m.sectionId);
                            }}
                            className="rounded-2xl border p-4"
                            style={{
                              backgroundColor: active ? colors.primarySoft : colors.bg,
                              borderColor: active ? colors.primary : colors.border,
                            }}>
                            <View className="flex-row items-center gap-3">
                              <View
                                className="rounded-xl px-3 py-2"
                                style={{
                                  backgroundColor: active ? colors.bgCard : colors.primarySoft,
                                }}>
                                <AppText bold style={{ color: colors.primary }}>
                                  {classData.find((c: any) => c.id === m.classId)?.name}{' '}
                                  {getSection(m.classId, m.sectionId)}
                                </AppText>
                              </View>
                              <View className="flex-1">
                                <AppText semibold>
                                  {subjectData.find((s: any) => s.id === m.subjectId)?.name}
                                </AppText>
                                <AppText size="min" muted>
                                  Periods / week: {m.periodsPerWeek}
                                </AppText>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View className="mb-4">
                    <AppText size="label" semibold>
                      Assignment Title
                    </AppText>
                    <TextInput
                      placeholder="e.g. Write an essay on Environment"
                      placeholderTextColor={colors.textMuted}
                      value={form.title}
                      onChangeText={(v) => setForm({ ...form, title: v })}
                      className="mt-1 rounded-xl border px-4 py-3"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                  </View>
                  <View className="mb-4">
                    <AppText size="label" semibold>
                      Due Date
                    </AppText>
                    <TouchableOpacity
                      onPress={openDatePicker}
                      className="mt-1 flex-row items-center justify-between rounded-xl border px-4 py-3"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                      <AppText>
                        {dueDate ? dueDate.toLocaleDateString('en-IN') : 'Select Due Date'}
                      </AppText>
                      <Calendar size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <View className="mb-1">
                    <AppText size="label" semibold>
                      Assignment Description (optional)
                    </AppText>
                    <TextInput
                      placeholder="Explain the assignment clearly…"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      value={form.description}
                      onChangeText={(v) => setForm({ ...form, description: v })}
                      className="mt-1 rounded-2xl border px-4 py-4"
                      style={{
                        backgroundColor: colors.bg,
                        minHeight: 90,
                        borderColor: colors.border,
                        color: colors.text,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={saveAssignment}
                    activeOpacity={0.9}
                    className="mt-4 items-center rounded-2xl py-4"
                    style={{ backgroundColor: colors.primary }}>
                    <AppText semibold style={{ color: '#fff' }}>
                      Save Assignment
                    </AppText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal
            visible={!!deleteTarget}
            transparent
            statusBarTranslucent
            animationType="fade"
            onRequestClose={() => setDeleteTarget(null)}>
            <View className="flex-1 items-center justify-center bg-black/80 px-6">
              <View className="w-full rounded-2xl p-6" style={{ backgroundColor: colors.bgCard }}>
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.dangerSoft }}>
                    <Trash2 size={18} color={colors.danger} />
                  </View>
                  <View className="flex-1">
                    <AppText semibold>Delete Assignment?</AppText>
                    <AppText size="subtext" muted>
                      This action cannot be undone
                    </AppText>
                  </View>
                </View>
                <View
                  className="mt-5 rounded-xl border p-4"
                  style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
                  <AppText semibold numberOfLines={2}>
                    {deleteTarget?.title}
                  </AppText>
                  <AppText size="subtext" muted className="mt-1">
                    Due {formatDueDate(deleteTarget?.dueDate)}
                  </AppText>
                </View>
                <View className="mt-4 flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setDeleteTarget(null)}
                    className="flex-1 items-center rounded-xl border py-3"
                    style={{ borderColor: colors.border }}>
                    <AppText semibold>Cancel</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await deleteAssignment(deleteTarget.assignmentId);
                      setDeleteTarget(null);
                    }}
                    className="flex-1 items-center rounded-xl py-3"
                    style={{ backgroundColor: colors.danger }}>
                    <AppText semibold style={{ color: '#fff' }}>
                      Delete
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showClassPicker}
            statusBarTranslucent={true}
            transparent
            animationType="slide"
            onRequestClose={() => setShowClassPicker(false)}>
            <View className="flex-1 justify-end bg-black/60">
              <View
                className="max-h-[70vh] rounded-t-3xl px-6 py-6"
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 3,
                  borderColor: colors.border,
                }}>
                <View className="flex-row items-center gap-2">
                  <ChevronRightCircle size={20} color={colors.primary} />
                  <AppText size="title" semibold>
                    Select Class
                  </AppText>
                </View>
                <FlatList
                  data={classData}
                  keyExtractor={(c: any) => c.id}
                  className="mt-4"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setClassId(item.id);
                        setSectionId('');
                        setShowClassPicker(false);
                      }}
                      key={item}
                      className="border-b px-5 py-4"
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
            statusBarTranslucent={true}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSectionPicker(false)}>
            <View className="flex-1 justify-end bg-black/60">
              <View
                className="max-h-[70vh] rounded-t-3xl px-6 py-6"
                style={{ backgroundColor: colors.bgCard }}>
                <View className="flex-row items-center gap-2">
                  <ChevronRightCircle size={20} color={colors.primary} />
                  <AppText size="title" semibold>
                    Select Section
                  </AppText>
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
                      className="border-b px-5 py-4"
                      style={{ borderColor: colors.border }}>
                      <AppText semibold>{getSection(classId, item.id)}</AppText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Modal
            visible={showSubjectPicker}
            statusBarTranslucent={true}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSubjectPicker(false)}>
            <View className="flex-1 justify-end bg-black/60">
              <View
                className="max-h-[70vh] rounded-t-3xl px-6 py-6"
                style={{ backgroundColor: colors.bgCard }}>
                <View className="flex-row items-center gap-2">
                  <ChevronRightCircle size={20} color={colors.primary} />
                  <AppText size="title" semibold>
                    Select Subject
                  </AppText>
                </View>
                <FlatList
                  data={subjectData}
                  keyExtractor={(s: any) => s.id}
                  className="mt-4"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setForm((f) => ({ ...f, subjectId: item.id }));
                        setShowSubjectPicker(false);
                      }}
                      className="border-b px-5 py-4"
                      style={{ borderColor: colors.border }}>
                      <AppText semibold>{item.name}</AppText>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
        </ScrollView>
      </Screen>
    </>
  );
}
