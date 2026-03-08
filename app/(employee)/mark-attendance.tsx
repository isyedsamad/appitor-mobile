import { Header } from '@/components/employee/Header';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { CheckCircle2, Nfc, ShieldAlert } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, TouchableOpacity, View } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import Toast from 'react-native-toast-message';

export default function MarkAttendancePage() {
    const { colors } = useTheme();
    const { schoolUser } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<'scanning' | 'verifying' | 'success' | 'error'>('scanning');
    const [errorMsg, setErrorMsg] = useState('');
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        let isMounted = true;

        async function initNfc() {
            try {
                const supported = await NfcManager.isSupported();
                if (!supported) {
                    setStatus('error');
                    setErrorMsg('NFC is not supported on this device or is disabled.');
                    return;
                }
                await NfcManager.start();
                startNfcScan();
            } catch (err) {
                console.error('NFC Init Error:', err);
                setStatus('error');
                setErrorMsg('Native module not found. This feature requires a Development Build (APK) and will not work in the standard Expo Go app.');
            }
        }

        async function startNfcScan() {
            try {
                await NfcManager.requestTechnology(NfcTech.Ndef);
                const tag = await NfcManager.getTag();

                if (tag && isMounted) {
                    handleTagScanned(tag.id || '');
                }
            } catch (ex) {
                console.warn('NFC Scan error:', ex);
                if (isMounted) {
                    NfcManager.cancelTechnologyRequest();
                }
            }
        }

        initNfc();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        return () => {
            isMounted = false;
            NfcManager.cancelTechnologyRequest().catch(() => 0);
        };
    }, []);

    const handleTagScanned = async (tagId: string) => {
        setStatus('verifying');
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const today = new Date();
            const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/school/attendance/smart-pass`, {
                tagValue: tagId,
                date: dateStr,
                session: schoolUser.currentSession,
                branchId: schoolUser.currentBranch,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStatus('success');
                setTimeout(() => router.back(), 2000);
            } else {
                throw new Error(response.data.message || 'Verification failed');
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to mark attendance');
            Toast.show({ type: 'error', text1: 'Attendance Failed', text2: errorMsg });
        }
    };

    return (
        <Screen scroll={false}>
            <Header title="SmartPass" />
            <View className="flex-1 items-center justify-center px-8">
                {status === 'scanning' && (
                    <View className="items-center">
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <LinearGradient
                                colors={[colors.primarySoft, colors.bg]}
                                className="p-10 rounded-full border-2"
                                style={{ borderColor: colors.primary }}
                            >
                                <Nfc size={80} color={colors.primary} />
                            </LinearGradient>
                        </Animated.View>
                        <AppText size="title" bold className="mt-10 text-center">
                            Ready to Scan
                        </AppText>
                        <AppText muted className="text-center mt-2 px-4">
                            Hold your phone near the SmartPass terminal to mark your attendance.
                        </AppText>
                    </View>
                )}

                {status === 'verifying' && (
                    <View className="items-center">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <AppText size="title" bold className="mt-8">
                            Verifying...
                        </AppText>
                        <AppText muted className="text-center mt-2">
                            Communicating with secure server.
                        </AppText>
                    </View>
                )}

                {status === 'success' && (
                    <View className="items-center">
                        <View className="p-8 rounded-full bg-green-100">
                            <CheckCircle2 size={80} color="#16a34a" />
                        </View>
                        <AppText size="title" bold className="mt-8 text-center text-green-600">
                            Attendance Marked!
                        </AppText>
                        <AppText muted className="text-center mt-2">
                            Your SmartPass was recognized successfully.
                        </AppText>
                    </View>
                )}

                {status === 'error' && (
                    <View className="items-center">
                        <View className="p-8 rounded-full bg-red-100">
                            <ShieldAlert size={80} color="#dc2626" />
                        </View>
                        <AppText size="title" bold className="mt-8 text-center text-red-600">
                            Scan Failed
                        </AppText>
                        <AppText muted className="text-center mt-2">
                            {errorMsg || 'Please try again or contact management.'}
                        </AppText>
                        <TouchableOpacity
                            onPress={() => {
                                setStatus('scanning');
                                NfcManager.start().then(() => NfcManager.requestTechnology(NfcTech.Ndef).then((tag: any) => handleTagScanned(tag?.id || '')));
                            }}
                            className="mt-8 px-8 py-3 rounded-xl"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <AppText bold style={{ color: '#fff' }}>Try Again</AppText>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Screen>
    );
}
