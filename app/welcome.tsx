import { useRouter } from 'expo-router';
import { Bell, Clock, GraduationCap, LayoutGrid, ShieldCheck, Users } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Buttons';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Welcome to Appitor',
    description:
      'Appitor is a thoughtfully designed school operating system that brings academics, administration, and communication into one calm, reliable platform.',
    icon: GraduationCap,
  },
  {
    title: 'Designed for Real School Systems',
    description:
      'Every screen in Appitor is built with task-first thinking, clear hierarchy, and long-term scalability for schools of all sizes.',
    icon: LayoutGrid,
  },
  {
    title: 'Teachers Stay Focused',
    description:
      'Attendance, homework, timetables, exams, and daily responsibilities are organized so teachers can focus on teaching, not managing tools.',
    icon: Clock,
  },
  {
    title: 'Students Stay Informed',
    description:
      'Students get clear visibility into their classes, homework, exams, notices, and progress without confusion or overload.',
    icon: Users,
  },
  {
    title: 'Parents Stay Connected',
    description:
      'Parents receive timely updates about attendance, performance, notices, and communication — all in one secure place.',
    icon: Bell,
  },
  {
    title: 'Secure by Design',
    description:
      'Role-based access, verified logins, and controlled permissions ensure school data stays protected at every level.',
    icon: ShieldCheck,
  },
];

export default function IntroWalkthrough() {
  const pagerRef = useRef<PagerView>(null);
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { colors } = useTheme();

  const isLast = index === SLIDES.length - 1;

  return (
    <Screen>
      <LinearGradient colors={[colors.primarySoft, colors.bg]} className="flex-1">
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => setIndex(e.nativeEvent.position)}>
          {SLIDES.map((slide, i) => {
            const Icon = slide.icon;
            return (
              <View key={i} style={{ width }} className="justify-center px-6">
                <View className="items-center gap-2">
                  <View
                    className="h-20 w-20 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: colors.primary }}>
                    <Icon size={36} color={'#fff'} />
                  </View>
                  <AppText size="heading" bold className="mt-6 text-center">
                    {slide.title}
                  </AppText>
                  <AppText muted className="text-center" style={{ lineHeight: 22 }}>
                    {slide.description}
                  </AppText>
                </View>
              </View>
            );
          })}
        </PagerView>
        <View className="gap-4 px-6 pb-3">
          <View className="flex-row justify-center gap-2">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 6,
                  width: i === index ? 20 : 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          <View className="flex-row gap-3">
            {!isLast && (
              <View className="flex-1">
                <Button title="Skip" variant="outline" onPress={() => router.replace('/login')} />
              </View>
            )}
            <View className="flex-1">
              <Button
                title={isLast ? 'Get Started' : 'Next'}
                onPress={() => {
                  if (isLast) {
                    router.replace('/login');
                  } else {
                    pagerRef.current?.setPage(index + 1);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}
