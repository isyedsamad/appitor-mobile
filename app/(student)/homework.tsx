import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Calendar, CircleOff, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Platform, ScrollView, TouchableOpacity, View } from 'react-native';

const formatDateDMY = (date: any) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

export default function EmployeeHomeworkPage() {
  const router = useRouter();
  const { schoolUser, classData, subjectData, employeeData } = useAuth();
  const { colors } = useTheme();
  const [date, setDate] = useState(new Date());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [DAYS_MAP, setDAYS_MAP] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  {
    Platform.OS !== 'android' && showDatePicker && (
      <DateTimePicker
        value={date}
        mode="date"
        display="spinner"
        onChange={onChange}
        accentColor={colors.primary}
      />
    );
  }

  const getSubjectName = (id: any) => subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) =>
    classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;
  const getTeacherName = (id: any) => employeeData.find((t: any) => t.uid === id)?.name;

  async function searchHomework(refresh: boolean) {
    setLoading(true);
    try {
      let ref;
      const selectedDate = formatDateDMY(date);
      ref = doc(
        db,
        'schools',
        schoolUser.schoolId,
        'branches',
        schoolUser.currentBranch,
        'learning',
        'items',
        'homework',
        `${schoolUser.className}_${schoolUser.section}_${selectedDate}`
      );
      const snap = await getDoc(ref);
      const sortedHW = snap.exists()
        ? snap.data().items
          ? snap.data().items.sort((a: any, b: any) => a.period - b.period)
          : []
        : [];
      setHomework(sortedHW);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHomework([]);
  }, [date]);

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  if (loading) return <Loading />;

  return (
    <>
      <Screen scroll={false}>
        <Header title="Homework" />
        <ScrollView>
          <View className="mx-7 mt-5 gap-3">
            <View>
              <AppText size="label" muted>
                Date
              </AppText>
              <TouchableOpacity
                onPress={showDatePickerDialog}
                activeOpacity={0.85}
                className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                }}>
                <AppText semibold>
                  {date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </AppText>
                <Calendar size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => searchHomework(true)}
              className="mt-1 flex-row items-center justify-center gap-3 rounded-xl py-3"
              style={{ backgroundColor: colors.primary }}>
              <Search size={15} color={'#fff'} />
              <AppText semibold style={{ color: '#fff' }}>
                Search Homework
              </AppText>
            </TouchableOpacity>
          </View>

          <View className="mt-6 flex-1 px-6">
            {homework.length === 0 ? (
              <View className="items-center px-10 py-12">
                <CircleOff size={32} color={colors.primary} />
                <AppText semibold className="mt-5">
                  No Homework found!
                </AppText>
                <AppText size="subtext" muted semibold className="text-center">
                  All clear! No homework is assigned for the selected date.
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
                    className="rounded-2xl border"
                    style={{
                      backgroundColor: colors.bgCard,
                      borderColor: colors.border,
                    }}>
                    <View
                      className="flex-row items-center gap-3 rounded-t-2xl p-5"
                      style={{
                        backgroundColor: colors.bg,
                        borderBottomWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <View
                        className="h-11 items-center justify-center rounded-xl px-3"
                        style={{ backgroundColor: colors.primarySoft }}>
                        <AppText bold style={{ color: colors.primary }}>
                          P{item.period}
                        </AppText>
                      </View>
                      <View className="flex-1">
                        <AppText size="body" semibold>
                          {getSubjectName(item.subjectId)}
                        </AppText>
                        <AppText size="subtext" muted>
                          Class: {getClassName(item.classId)}{' '}
                          {getSection(item.classId, item.sectionId)}
                        </AppText>
                      </View>
                      <View
                        className="rounded-2xl px-3 py-2"
                        style={{
                          backgroundColor: colors.bgCard,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}>
                        <AppText size="min" muted semibold>
                          {capitalizeWords(getTeacherName(item.teacherId))}
                        </AppText>
                      </View>
                    </View>
                    <View className="px-5 py-4">
                      <AppText style={{ lineHeight: 22 }}>{item.content}</AppText>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}
