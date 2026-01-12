import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export async function login(email: string, password: string) {
  // return signInWithEmailAndPassword(auth, email, password);
  try {
    const fbUser = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, 'schoolUsers', fbUser.user.uid));
    if(!userSnap.exists()) {
      logout();
      return { success: false, msg: 'Invalid App ID or Password' };
    }
    const userData = userSnap.data();
    if(userData.status == "disabled") {
      logout();
      return { success: false, msg: 'Your App ID has been deactivated! Please contact school.' };
    }
    return { success: true };
  } catch(err) {
    return { success: false, msg: err };
  }
}

export function logout() {
  return signOut(auth);
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback);
}
