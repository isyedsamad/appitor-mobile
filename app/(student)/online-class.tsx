import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Blocks, Rocket, Video } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function OnlineClassPage() {
    const { colors } = useTheme();

    return (
        <Screen scroll={false}>
            <Header title="Online Class" />
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
                        <Video size={48} color={colors.primary} />
                    </LinearGradient>

                    <AppText size="title" bold className="text-center">
                        Online Classes
                    </AppText>
                    <AppText size='subtext' muted className="text-center px-6">
                        We are working hard to bring the virtual classroom experience to your fingertips.
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
                                    Live interactive classes will be available shortly in the next update.
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
                            icon={<Video size={20} color={colors.primary} />}
                            title="HD Video Classes"
                            desc="Seamless high-definition video streaming for all your subjects."
                        />
                        <FeatureItem
                            icon={<Blocks size={20} color={colors.primary} />}
                            title="Interactive Tools"
                            desc="Whiteboards, screen sharing, and real-time chat integration."
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
