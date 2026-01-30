import { db } from '@/lib/firebase';
import { getFcmToken, requestNotificationPermission } from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

export async function registerFcmToken(context: {
  uid: string;
  role: string;
  schoolId: string;
  branchId: string;
  classId?: string;
  sectionId?: string;
}) {
  const allowed = await requestNotificationPermission();
  if (!allowed) return;
  const token = await getFcmToken();
  if (!token) return;
  const lastToken = await AsyncStorage.getItem('FCM_TOKEN');
  if (lastToken === token) return;
  await setDoc(doc(db, 'fcmTokens', token), {
    token,
    uid: context.uid,
    role: [context.role],
    schoolId: context.schoolId,
    branchId: context.branchId,
    classId: context.classId || null,
    sectionId: context.sectionId || null,
    platform: 'android',
    active: true,
    lastSeenAt: serverTimestamp(),
  });
  await AsyncStorage.setItem('FCM_TOKEN', token);
}

export async function unregisterFcmToken() {
  const token = await AsyncStorage.getItem('FCM_TOKEN');
  if (!token) return;
  await updateDoc(doc(db, 'fcmTokens', token), {
    active: false,
  });
  await AsyncStorage.removeItem('FCM_TOKEN');
}
