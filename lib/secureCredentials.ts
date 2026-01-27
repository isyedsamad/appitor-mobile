import * as SecureStore from 'expo-secure-store';

function key(uid: string) {
  return `APPITOR_PASSWORD_${uid}`;
}

export async function savePassword(uid: string, password: string) {
  await SecureStore.setItemAsync(key(uid), password, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function getPassword(uid: string) {
  return SecureStore.getItemAsync(key(uid));
}

export async function removePassword(uid: string) {
  await SecureStore.deleteItemAsync(key(uid));
}
