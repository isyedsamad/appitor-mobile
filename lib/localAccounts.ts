import AsyncStorage from '@react-native-async-storage/async-storage';
import { removePassword, savePassword } from './secureCredentials';

const ACCOUNTS_KEY = 'APPITOR_ACCOUNTS';
const ACTIVE_KEY = 'APPITOR_ACTIVE_UID';

export async function getAccounts() {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getActiveUID() {
  return AsyncStorage.getItem(ACTIVE_KEY);
}

export async function setActiveUID(uid: string) {
  await AsyncStorage.setItem(ACTIVE_KEY, uid);
}

export async function clearActiveUID() {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

export async function saveLoginAccount({ uid, email, password }: any) {
  const list = await getAccounts();
  const idx = list.findIndex((a: any) => a.uid === uid);
  const base = {
    uid,
    email,
    lastLogin: Date.now(),
  };

  if (idx !== -1) list[idx] = { ...list[idx], ...base };
  else list.push(base);
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  await savePassword(uid, password);
  await setActiveUID(uid);
}

export async function updateAccountProfile(uid: string, data: any) {
  const list = await getAccounts();
  const idx = list.findIndex((a: any) => a.uid === uid);
  if (idx === -1) return;
  list[idx] = {
    ...list[idx],
    ...data,
  };

  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export async function removeAccount(uid: string) {
  const list = await getAccounts();
  const filtered = list.filter((a: any) => a.uid !== uid);
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));
  await removePassword(uid);
}
