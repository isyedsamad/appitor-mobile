import { auth } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

export async function changePasswordFirebase(
  currentPassword: string,
  newPassword: string,
  onSuccess: () => void,
  onError: (msg: string) => void
) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    onError('User not authenticated');
    return;
  }
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    onSuccess();
  } catch (err: any) {
    if (err.code === 'auth/wrong-password') {
      onError('Current password is incorrect');
    } else if (err.code === 'auth/invalid-credential') {
      onError('Current password is incorrect');
    } else if (err.code === 'auth/weak-password') {
      onError('Password should be at least 6 characters');
    } else {
      onError('Failed: ' + err.message);
    }
  }
}
