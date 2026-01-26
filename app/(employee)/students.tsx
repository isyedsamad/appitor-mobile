import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronRightCircle, Search } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function StudentsListPage() {
  const { schoolUser, classData } = useAuth();
  const { colors } = useTheme();
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const selectedClass = classData?.find((c: any) => c.id === classId);
  const selectedSection = selectedClass?.sections?.find((s: any) => s.id === sectionId);

  async function loadStudents() {
    if (!classId || !sectionId) {
      Toast.show({ type: 'error', text1: 'Select class & section' });
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
        'meta',
        `${classId}_${sectionId}`
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setStudents([]);
        return;
      }
      const activeStudents = (snap.data().students || [])
        .filter((s: any) => s.status === 'active')
        .sort((a: any, b: any) => a.rollNo - b.rollNo);
      setStudents(activeStudents);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load students',
        text2: String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  const capitalizeWords = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

  if (loading) return <Loading />;
  return (
    <Screen scroll={false}>
      <Header title="Students" />
      <ScrollView>
        <View className="mx-7 mt-5 flex-row gap-3">
          <View className="flex-1 gap-1">
            <AppText size="label">Class</AppText>
            <TouchableOpacity
              onPress={() => setShowClassPicker(true)}
              className="rounded-xl border px-4 py-3"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
              <AppText>{selectedClass?.name || 'Select Class'}</AppText>
            </TouchableOpacity>
          </View>
          <View className="flex-1 gap-1">
            <AppText size="label">Section</AppText>
            <TouchableOpacity
              disabled={!classId}
              onPress={() => setShowSectionPicker(true)}
              className="rounded-xl border px-4 py-3"
              style={{
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                opacity: classId ? 1 : 0.5,
              }}>
              <AppText>{selectedSection?.name || 'Section'}</AppText>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={loadStudents}
          className="mx-7 mt-3 flex-row items-center justify-center gap-2 rounded-xl py-3"
          style={{ backgroundColor: colors.primary }}>
          <Search size={16} color="#fff" />
          <AppText semibold alwaysWhite>
            View Students
          </AppText>
        </TouchableOpacity>
        <View className="mt-6 flex-1 px-5">
          {!loading && (
            <FlatList
              data={students}
              scrollEnabled={false}
              keyExtractor={(item) => item.uid}
              contentContainerStyle={{ gap: 10, paddingBottom: 30 }}
              ListEmptyComponent={
                <View className="items-center py-20">
                  <AppText muted>No students found</AppText>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/(employee)/student/[studentId]/attendance',
                      params: { studentId: item.uid },
                    })
                  }>
                  <View
                    className="flex-row items-center justify-between rounded-2xl px-6 py-5"
                    style={{
                      backgroundColor: colors.bgCard,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    <View className="flex-row items-center gap-4">
                      <View
                        className="rounded-lg px-2 py-2"
                        style={{
                          backgroundColor: colors.primarySoft,
                          borderWidth: 1,
                          borderColor: colors.primary,
                        }}>
                        <AppText semibold primary>
                          {item.rollNo.toString().padStart(2, '0')}
                        </AppText>
                      </View>
                      <View>
                        <AppText semibold>{capitalizeWords(item.name)}</AppText>
                        <AppText size="min" muted semibold>
                          App ID: {item.appId}
                        </AppText>
                      </View>
                    </View>
                    <ChevronRightCircle size={18} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
        <PickerModal
          visible={showClassPicker}
          title="Select Class"
          data={classData}
          onClose={() => setShowClassPicker(false)}
          onSelect={(c: any) => {
            setClassId(c.id);
            setSectionId('');
          }}
        />
        <PickerModal
          visible={showSectionPicker}
          title="Select Section"
          data={selectedClass?.sections || []}
          onClose={() => setShowSectionPicker(false)}
          onSelect={(s: any) => setSectionId(s.id)}
        />
      </ScrollView>
    </Screen>
  );
}

function PickerModal({ visible, title, data, onSelect, onClose }: any) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose()}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          className="max-h-[70vh] rounded-t-3xl px-8 py-6"
          style={{ backgroundColor: colors.bgCard }}>
          <View className="mb-4 flex-row items-center gap-2">
            <ChevronRightCircle size={17} color={colors.primary} />
            <AppText size="title" semibold>
              {title}
            </AppText>
          </View>
          <FlatList
            data={data}
            keyExtractor={(i: any) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className="border-b px-6 py-4"
                style={{ borderColor: colors.border }}>
                <AppText>{item.name}</AppText>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
