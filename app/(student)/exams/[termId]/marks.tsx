import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import Loading from '@/components/ui/Loading';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Crown,
  LineChart as LineIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const STRONG_INSIGHTS = [
  'Demonstrates excellent understanding with consistent performance.',
  'Applies concepts effectively across different question types.',
  'Displays solid preparation and command over fundamentals.',
  'Exhibits high accuracy with minimal conceptual gaps.',
];

const STABLE_INSIGHTS = [
  'Maintains steady understanding with scope for refinement.',
  'Shows good grasp of basics but needs deeper practice.',
  'Performance is consistent, though advanced concepts need focus.',
  'Understands core topics but accuracy can be improved.',
];

const WEAK_INSIGHTS = [
  'Requires focused revision of key concepts.',
  'Understanding is partial and needs structured practice.',
  'Conceptual gaps are affecting overall performance.',
  'Needs regular practice to improve confidence.',
];

const CRITICAL_INSIGHTS = [
  'Immediate attention is recommended to avoid learning gaps.',
  'Foundational concepts need urgent revision.',
  'Requires guided learning and consistent follow-up.',
];

function getInsight(percent: number | null, index: number) {
  if (percent == null) return 'Not evaluated in this term.';
  if (percent >= 75) return STRONG_INSIGHTS[index % STRONG_INSIGHTS.length];
  if (percent >= 60) return STABLE_INSIGHTS[index % STABLE_INSIGHTS.length];
  if (percent >= 45) return WEAK_INSIGHTS[index % WEAK_INSIGHTS.length];
  return CRITICAL_INSIGHTS[index % CRITICAL_INSIGHTS.length];
}

const GRADE_FROM_PERCENT = (p: number) =>
  p >= 90 ? 'A' : p >= 75 ? 'B' : p >= 60 ? 'C' : p >= 45 ? 'D' : 'E';

export default function StudentExamResultPage() {
  const { termId, termName } = useLocalSearchParams<{ termId: string; termName: string }>();
  const { schoolUser, subjectData, classData } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const { width: screenWidth } = Dimensions.get('window');
  const containerPadding = 60;
  const screenPadding = 40;
  const chartWidth = screenWidth - screenPadding - containerPadding;
  const [marks, setMarks] = useState<any>({});
  const getSubjectName = (id: any) => subjectData.find((s: any) => s.id === id)?.name;
  const getClassName = (id: any) => classData.find((c: any) => c.id === id)?.name;
  const getSection = (cid: any, sid: any) =>
    classData?.find((c: any) => c.id === cid)?.sections.find((s: any) => s.id == sid)?.name;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const setupQ = query(
          collection(
            db,
            'schools',
            schoolUser.schoolId,
            'branches',
            schoolUser.currentBranch,
            'exams',
            'items',
            'exam_setups'
          ),
          where('termId', '==', termId)
        );
        const setupSnap = await getDocs(setupQ);
        const setups = setupSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSubjects(setups);
        const marksQ = query(
          collection(
            db,
            'schools',
            schoolUser.schoolId,
            'branches',
            schoolUser.currentBranch,
            'exams',
            'items',
            'student_marks'
          ),
          where('studentId', '==', schoolUser.uid),
          where('termId', '==', termId)
        );
        const marksSnap = await getDocs(marksQ);
        if (!marksSnap.empty) {
          const data = marksSnap.docs[0].data();
          const m: any = {};
          data.marks.forEach((x: any) => {
            m[x.setupId] = x.value;
          });
          setMarks(m);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const analytics = useMemo(() => {
    let total = 0;
    let count = 0;
    const subjectStats = subjects
      .map((s, i) => {
        const raw = marks[s.id];
        if (raw == null) return null;
        let percent = 0;
        if (s.markingType === 'marks') {
          percent = Math.round((raw / s.maxMarks) * 100);
        } else {
          percent = raw === 'A' ? 90 : raw === 'B' ? 75 : raw === 'C' ? 60 : 45;
        }
        total += percent;
        count++;
        return {
          id: s.id,
          isGraded: s.markingType != 'marks' ? true : false,
          grade: s.markingType != 'marks' ? raw : '',
          name: subjectData.find((x: any) => x.id === s.subjectId)?.name,
          percent,
          insight: getInsight(percent, i),
        };
      })
      .filter(Boolean);
    const avg = count > 0 ? Math.round(total / count) : null;
    return {
      avg,
      subjects: subjectStats,
      top: subjectStats.sort((a: any, b: any) => b.percent - a.percent)[0],
      low: subjectStats.sort((a: any, b: any) => a.percent - b.percent)[0],
    };
  }, [marks, subjects]);

  const chartData = analytics.subjects.map((s: any) => ({
    value: s.percent,
    label: s.name,
  }));

  const overallGrade = GRADE_FROM_PERCENT(analytics.avg || 0);

  if (loading) return <Loading />;

  const capitalizeWords = (str: string) => {
    if (!str) return;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  };

  const initials = schoolUser.name
    .split(' ')
    .map((w: any) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Screen scroll={false}>
      <Header title="Performance Report" />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View
          className="mx-5 mt-5 rounded-2xl p-5"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.primarySoft }}>
              <Brain size={20} color={colors.primary} />
            </View>
            <View>
              <AppText semibold>Overall Performance</AppText>
              <AppText size="min" muted>
                AI-generated academic summary
              </AppText>
            </View>
          </View>
          <View className="mt-4 flex-row items-center gap-4">
            {/* <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primarySoft }}>
              <AppText size="body" semibold primary>
                {initials}
              </AppText>
            </View> */}
            <View className="flex-1">
              <AppText size="title" semibold>
                {capitalizeWords(schoolUser.name)}
              </AppText>
              <AppText size="min" muted semibold>
                {termName} • {schoolUser.appId}
              </AppText>
            </View>
            <View className="rounded-lg px-3 py-1" style={{ backgroundColor: colors.primary }}>
              <AppText size="title" semibold alwaysWhite>
                {analytics.avg !== null ? `${analytics.avg}%` : '-'}
              </AppText>
            </View>
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <View className="rounded-lg px-3 py-1" style={{ backgroundColor: colors.primarySoft }}>
              <AppText size="body" semibold primary>
                Grade: {overallGrade || '-'}
              </AppText>
            </View>
            <View
              className="rounded-lg px-3 py-1"
              style={{
                backgroundColor: analytics.avg
                  ? analytics.avg >= 75
                    ? colors.statusPbg
                    : analytics.avg >= 60
                      ? colors.statusMbg
                      : colors.statusAbg
                  : colors.primarySoft,
              }}>
              <AppText
                size="label"
                semibold
                style={{
                  color: analytics.avg
                    ? analytics.avg >= 75
                      ? colors.statusPtext
                      : analytics.avg >= 60
                        ? colors.statusMtext
                        : colors.statusAtext
                    : colors.primary,
                }}>
                {analytics.avg
                  ? analytics.avg >= 75
                    ? 'Strong Performance'
                    : analytics.avg >= 60
                      ? 'Stable Performance'
                      : 'Needs Attention'
                  : '-'}
              </AppText>
            </View>
          </View>
        </View>
        <View
          className="mx-5 mt-4 overflow-hidden rounded-2xl p-4"
          style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
          <View className="mb-3 flex-row items-center gap-2">
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.primarySoft }}>
              <LineIcon size={18} color={colors.primary} />
            </View>
            <AppText semibold>Subject-wise Performance</AppText>
          </View>
          <LineChart
            adjustToWidth={true}
            data={chartData}
            width={chartWidth}
            height={200}
            initialSpacing={15}
            endSpacing={15}
            color={colors.primary}
            dataPointsColor={colors.text}
            rulesColor={colors.textMuted}
            xAxisColor={colors.textMuted}
            yAxisColor={colors.textMuted}
            verticalLinesColor={colors.border}
            textColor={colors.textMuted}
            curved
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            yAxisLabelWidth={20}
          />
        </View>
        <View
          className="mx-5 mt-4 rounded-2xl px-5 py-4"
          style={{
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <View className="mb-4 flex-row items-center gap-2">
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.primarySoft }}>
              <BarChart3 size={18} color={colors.primary} />
            </View>
            <View>
              <AppText semibold>Performance Analytics</AppText>
              <AppText size="min" muted>
                Strengths, risks & balance overview
              </AppText>
            </View>
          </View>
          <View className="flex-row gap-3">
            <AnalyticsMiniCard
              icon={Crown}
              title="Strength Zone"
              subject={analytics.top?.name}
              percent={analytics.top?.isGraded ? analytics.top?.grade : analytics.top?.percent}
              bg={colors.statusPbg}
              text={colors.statusPtext}
              hint="Consistently strong"
              isGraded={analytics.top?.isGraded}
            />
            <AnalyticsMiniCard
              icon={AlertTriangle}
              title="Focus Zone"
              subject={analytics.low?.name}
              percent={analytics.low?.isGraded ? analytics.low?.grade : analytics.low?.percent}
              bg={colors.statusAbg}
              text={colors.statusAtext}
              hint="Needs more attention"
              isGraded={analytics.low?.isGraded}
            />
          </View>
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex items-start justify-start">
              <AppText size="label" muted>
                Performance Gap
              </AppText>
              <View
                className="rounded-lg px-3 py-1"
                style={{ backgroundColor: colors.primarySoft }}>
                <AppText semibold primary>
                  {analytics.top && analytics.low
                    ? `${analytics.top.percent - analytics.low.percent}%`
                    : '-'}
                </AppText>
              </View>
            </View>
            <View
              className="rounded-full px-4 py-1.5"
              style={{
                backgroundColor:
                  analytics.top &&
                  analytics.low &&
                  analytics.top.percent - analytics.low.percent < 15
                    ? colors.statusPbg
                    : colors.statusLbg,
              }}>
              <AppText
                size="min"
                semibold
                style={{
                  color:
                    analytics.top &&
                    analytics.low &&
                    analytics.top.percent - analytics.low.percent < 15
                      ? colors.statusPtext
                      : colors.statusLtext,
                }}>
                {analytics.top &&
                analytics.low &&
                analytics.top.percent - analytics.low.percent < 15
                  ? 'Balanced Performance'
                  : 'Uneven Performance'}
              </AppText>
            </View>
          </View>
          <View className="mt-2 rounded-xl px-4 py-3" style={{ backgroundColor: colors.bg }}>
            <AppText size="subtext" muted>
              <AppText size="subtext" semibold muted>
                Insight:{' '}
              </AppText>
              {analytics.top && analytics.low
                ? analytics.top.percent - analytics.low.percent < 15
                  ? 'The student shows consistent understanding across subjects with no major risk areas.'
                  : 'There is a noticeable performance imbalance. Focused effort on weaker subjects can significantly improve overall results.'
                : 'Performance data will appear once marks are available.'}
            </AppText>
          </View>
        </View>
        <View className="mx-5 mt-5 gap-4">
          {analytics.subjects.map((s: any) => {
            const diff = analytics.avg != null ? s.percent - analytics.avg : null;
            const status =
              s.percent >= 75
                ? {
                    label: 'Strong Performance',
                    bg: colors.statusPbg,
                    text: colors.statusPtext,
                  }
                : s.percent >= 60
                  ? {
                      label: 'Stable Performance',
                      bg: colors.statusMbg,
                      text: colors.statusMtext,
                    }
                  : {
                      label: 'Needs Focus',
                      bg: colors.statusAbg,
                      text: colors.statusAtext,
                    };

            const isPositive = diff !== null && diff >= 0;
            return (
              <View
                key={s.id}
                className="rounded-2xl px-5 py-5"
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <AppText size="body" semibold>
                      {s.name}
                    </AppText>
                    <View
                      className="mt-1 self-start rounded-lg px-2 py-1"
                      style={{ backgroundColor: status.bg }}>
                      <AppText size="min" semibold style={{ color: status.text }}>
                        {status.label}
                      </AppText>
                    </View>
                  </View>
                  <View className="rounded-lg px-2 py-1" style={{ backgroundColor: colors.border }}>
                    <AppText size="body" semibold>
                      {s.isGraded ? s.grade : `${s.percent}%`}
                    </AppText>
                  </View>
                </View>
                <View
                  className="mb-2 h-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: colors.border }}>
                  <View
                    style={{
                      width: `${s.percent}%`,
                      height: '100%',
                      backgroundColor:
                        s.percent >= 75
                          ? colors.primary
                          : s.percent >= 60
                            ? colors.warning
                            : colors.danger,
                    }}
                  />
                </View>
                <View className="mb-1">
                  <AppText size="subtext" muted>
                    <AppText size="subtext" semibold muted>
                      Insight:{' '}
                    </AppText>
                    {s.insight}
                  </AppText>
                </View>
                {diff !== null && (
                  <View className="mt-1 flex-row items-center gap-1">
                    {isPositive ? (
                      <ArrowUpRight size={14} color={colors.statusPtext} />
                    ) : (
                      <ArrowDownRight size={14} color={colors.statusAtext} />
                    )}

                    <AppText size="subtext" muted>
                      {isPositive ? 'Above' : 'Below'} overall average by{' '}
                      <AppText
                        semibold
                        style={{
                          color: isPositive ? colors.statusPtext : colors.statusAtext,
                        }}>
                        {Math.abs(diff)}%
                      </AppText>
                    </AppText>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

function AnalyticsMiniCard({
  icon: Icon,
  title,
  subject,
  percent,
  bg,
  text,
  hint,
  isGraded = false,
}: any) {
  return (
    <View
      className="flex-1 rounded-lg px-4 py-3"
      style={{
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: bg,
      }}>
      <View className="mb-2 flex-row items-center gap-2">
        <Icon size={15} color={text} />
        <AppText size="subtext" semibold style={{ color: text }}>
          {title}
        </AppText>
      </View>
      <AppText size="body" semibold>
        {subject || '-'}
      </AppText>
      <AppText size="title" semibold style={{ color: text }}>
        {percent != null ? (isGraded ? percent : `${percent}%`) : '-'}
      </AppText>
      <AppText size="min" semibold>
        {hint}
      </AppText>
    </View>
  );
}
