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
  console.log(11111 + ' - ' + status);
  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    return result.status === 'granted';
  }
  return true;
}

export async function getFcmToken() {
  console.log(222223333333 + ' - ' + Device.isDevice + ' - ' + Device.osName);
  if (Device.osName !== 'Android' || Device.isDevice === false) {
    console.log('Emulator detected');
    return null;
  }
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.slug;
    console.log('22222333333 - Project ID:', projectId);
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;
    console.log(22222 + ' - ' + token);
    return token;
  } catch (err) {
    console.log(2222223333 + ' - ' + err);
  }
}
