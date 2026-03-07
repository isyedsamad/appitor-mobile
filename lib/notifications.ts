import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    return result.status === 'granted';
  }
  return true;
}

export async function getFcmToken() {
  const isPhysicalDevice =
    Device.isDevice === true && (Device.brand !== null || Device.modelName !== null);
  if (!isPhysicalDevice) {
    console.log('Emulator detected');
    return null;
  }
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.slug;
    
    if (!projectId) {
      Toast.show({ type: 'error', text1: 'Push Notification', text2: 'Missing Project ID' });
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;
    return token;
  } catch (err) {
    console.log('Token Error: ' + err);
    Toast.show({ type: 'error', text1: 'Token Error', text2: String(err) });
  }
}
