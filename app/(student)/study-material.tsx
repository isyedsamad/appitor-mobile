import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, FileText, NotebookText, Rocket } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function StudyMaterialPage() {
    const { colors } = useTheme();

    return (
        <Screen scroll={false}>
            <Header title="Study Material" />
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 mt-5">
                <View
                    className="items-center py-6 rounded-xl border"
                    style={{
                        backgroundColor: colors.bgCard,
                        borderColor: colors.border,
                    }}
                >
                    <LinearGradient
                        colors={[colors.primarySoft, colors.bg]}
                        className="p-6 mb-3"
                        style={{
                            borderRadius: 15
                        }}
                    >
                        <NotebookText size={48} color={colors.primary} />
                    </LinearGradient>

                    <AppText size="title" bold className="text-center">
                        Study Material
                    </AppText>
                    <AppText size='subtext' muted className="text-center px-6">
                        Access and manage all your teaching resources and learning materials in one place.
                    </AppText>

                    <View className="mt-6 mx-6 w-full px-6">
                        <LinearGradient
                            colors={[colors.statusPbg, colors.statusPbg + '44']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="flex-row items-center gap-4 p-5 border"
                            style={{ borderColor: colors.statusPborder, borderRadius: 16 }}
                        >
                            <View
                                className="p-3 rounded-xl"
                                style={{ backgroundColor: colors.bgCard }}
                            >
                                <Rocket size={24} color={colors.statusPtext} />
                            </View>
                            <View className="flex-1">
                                <AppText bold style={{ color: colors.statusPtext }}>
                                    Feature Coming Soon!
                                </AppText>
                                <AppText size="min" semibold style={{ color: colors.statusPtext, opacity: 0.8 }}>
                                    Digital library and resource sharing will be available in the next update.
                                </AppText>
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                <View className="mt-5 px-2">
                    <AppText size="label" semibold muted className="uppercase tracking-widest">
                        Features Highlights
                    </AppText>
                    <View className="mt-2 gap-2">
                        <FeatureItem
                            icon={<FileText size={20} color={colors.primary} />}
                            title="Resource Sharing"
                            desc="Share PDFs, notes, and documents with your classes easily."
                        />
                        <FeatureItem
                            icon={<BookOpen size={20} color={colors.primary} />}
                            title="Subject Library"
                            desc="Organized repository for all subject-specific materials."
                        />
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}

function FeatureItem({ icon, title, desc }: { icon: any; title: string; desc: string }) {
    const { colors } = useTheme();
    return (
        <View
            className="flex-row items-start gap-4 p-4 rounded-2xl border"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
        >
            <View className="p-2.5 rounded-xl" style={{ backgroundColor: colors.primarySoft }}>
                {icon}
            </View>
            <View className="flex-1">
                <AppText semibold>{title}</AppText>
                <AppText size="subtext" muted className="mt-0.5">
                    {desc}
                </AppText>
            </View>
        </View>
    );
}
