import Constants from 'expo-constants';
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
  if (!Constants.isDevice) {
    console.log('Must use physical device');
    return null;
  }
  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })
  ).data;
  console.log(22222 + ' - ' + token);
  return token;
}
