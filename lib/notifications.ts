import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

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
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.slug;
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;
    return token;
  } catch (err) {
    console.log('Token Error: ' + err);
  }
}
