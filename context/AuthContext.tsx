import { auth, db } from '@/lib/firebase';
import {
  getAccounts,
  getActiveUID,
  removeAccount,
  setActiveUID,
  updateAccountProfile,
} from '@/lib/localAccounts';
import { logout, subscribeToAuthChanges } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

type AuthContextType = {
  schoolUser: any | null;
  loading: boolean;
  isLoaded: boolean;
  classData: any | null;
  subjectData: any | null;
  employeeData: any | [];
  handleSignOut: any;
  handleSwitch: any;
  sessionAttData: any;
  attendance: any;
  authState: any;
  setAuthState: any;
};

type AuthState = 'loading' | 'logged-out' | 'switch-required' | 'ready';

const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [schoolUser, setSchoolUser] = useState(null as any);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [sessionAttData, setSessionAttData] = useState(null as any);
  const [classData, setClassData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // async function handleSignOut() {
  //   try {
  //     await signOut(auth);
  //   } catch (error) {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Failed to SignOut',
  //       text2: 'Error: ' + error,
  //     });
  //     console.error('Error signing out:', error);
  //   }
  // }
  // async function handleSwitch() {
  //   try {
  //     await signOut(auth);
  //   } catch (error) {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Failed to SignOut',
  //       text2: 'Error: ' + error,
  //     });
  //     console.error('Error signing out:', error);
  //   }
  // }
  async function handleSwitch() {
    try {
      await AsyncStorage.removeItem('APPITOR_ACTIVE_UID');
      setAuthState('switch-required');
      router.replace('/switch');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Switch Account',
        text2: String(error),
      });
      console.error('Switch error:', error);
    }
  }
  async function handleSignOut(activeUID: any) {
    try {
      await removeAccount(activeUID);
      setAuthState('switch-required');
      const accounts = await getAccounts();
      if (accounts.length > 0) {
        const next = accounts[0];
        await setActiveUID(next.uid);
        router.replace('/switch');
      } else {
        await AsyncStorage.removeItem('APPITOR_ACTIVE_UID');
        await signOut(auth);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Sign Out',
        text2: String(error),
      });
      console.error('Logout error:', error);
    }
  }

  const loadClasses = async (schoolId: any, branch: any) => {
    if (!branch) return;
    setLoading(true);
    const classSnap = await getDoc(
      doc(db, 'schools', schoolId, 'branches', branch, 'classes', 'data')
    );
    if (!classSnap.exists()) return;
    const classdata = classSnap.data();
    setClassData(classdata.classData);
    setLoading(false);
  };
  const loadSubjects = async (schoolId: any, branch: any) => {
    if (!branch) return;
    setLoading(true);
    const subSnap = await getDoc(
      doc(db, 'schools', schoolId, 'branches', branch, 'subjects', 'branch_subjects')
    );
    if (!subSnap.exists()) return;
    const subdata = subSnap.data();
    setSubjectData(subdata.subjects);
    setLoading(false);
  };
  const loadEmployee = async (schoolId: any, branch: any) => {
    if (!branch) return;
    setLoading(true);
    try {
      const metaRef = doc(db, 'schools', schoolId, 'branches', branch, 'meta', 'employees');
      const snap = await getDoc(metaRef);
      if (!snap.exists()) {
        setEmployeeData([]);
        return;
      }
      const employees = snap.data().employees || [];
      employees.sort((a: any, b: any) => String(a.employeeId).localeCompare(String(b.employeeId)));
      setEmployeeData(employees);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Open App',
        text2: 'Error: ' + err,
      });
      console.error('LOAD EMPLOYEE META ERROR:', err);
    } finally {
      setLoading(false);
    }
  };
  async function loadSessionAttendanceData(
    schoolId: any,
    branch: any,
    studentId: any,
    session: any
  ) {
    setLoading(true);
    const ref = doc(
      db,
      'schools',
      schoolId,
      'branches',
      branch,
      'students',
      studentId,
      'attendance_session',
      session
    );
    const snap = await getDoc(ref);
    setSessionAttData(snap.exists() ? snap.data() : null);
  }
  const loadAttendanceStudent = async (
    uid: any,
    className: any,
    section: any,
    schoolId: any,
    branch: any
  ) => {
    try {
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${today.getFullYear()}`;
      const docId = `student_${dateStr}_${className}_${section}`;
      const docRef = doc(db, 'schools', schoolId, 'branches', branch, 'attendance', docId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        setAttendance(null);
      } else {
        const data: any = snap.data();
        const status = data.records?.[uid] ?? null;
        setAttendance({
          date: data.date,
          status,
          locked: data.locked,
        });
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };
  const loadAttendanceEmployee = async (uid: any, schoolId: any, branch: any) => {
    try {
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${today.getFullYear()}`;
      const docId = `employee_${dateStr}`;
      const docRef = doc(db, 'schools', schoolId, 'branches', branch, 'attendance', docId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        setAttendance(null);
      } else {
        const data: any = snap.data();
        const status = data.records?.[uid] ?? null;
        setAttendance({
          date: data.date,
          status,
          locked: data.locked,
        });
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (firebaseUser) => {
      setLoading(true);
      setIsLoaded(false);
      if (!firebaseUser) {
        const accounts = await getAccounts();
        setSchoolUser(null);
        setAuthState(accounts.length > 0 ? 'switch-required' : 'logged-out');
        setLoading(false);
        setIsLoaded(true);
        return;
      }
      try {
        var activeUID = await getActiveUID();
        // if (!currentActiveUID) {
        //   setAuthState('switch-required');
        //   setSchoolUser(null);
        //   return;
        // }
        if (!activeUID) {
          activeUID = firebaseUser.uid;
          await setActiveUID(firebaseUser.uid);
        }
        // const activeUID = await getActiveUID();
        // if (!activeUID || activeUID !== firebaseUser.uid) {
        //   setSchoolUser(null);
        //   setAuthState('switch-required');
        //   return;
        // }
        const userSnap = await getDoc(doc(db, 'schoolUsers', activeUID));
        if (!userSnap.exists()) {
          await logout();
          setSchoolUser(null);
          setAuthState('logged-out');
          return;
        }
        const userData = userSnap.data();
        if (userData.status == 'disabled') {
          await logout();
          setSchoolUser(null);
          setAuthState('logged-out');
          return;
        }
        const schoolSnap = await getDoc(doc(db, 'schools', userData.schoolId));
        if (!schoolSnap.exists()) {
          await logout();
          setSchoolUser(null);
          setAuthState('logged-out');
          return;
        }
        const schoolData = schoolSnap.data();
        if (schoolData.status != 'active') {
          await logout();
          setSchoolUser(null);
          setAuthState('logged-out');
          return;
        }
        let roleData = null;
        if (userData.roleId != 'student') {
          const roleSnap = await getDoc(doc(db, 'roles', userData.roleId));
          if (!roleSnap.exists()) {
            await logout();
            setSchoolUser(null);
            setAuthState('logged-out');
            return;
          }
          roleData = roleSnap.data();
        }
        await loadClasses(userData.schoolId, userData.currentBranch);
        await loadSubjects(userData.schoolId, userData.currentBranch);
        await loadEmployee(userData.schoolId, userData.currentBranch);
        if (userData.roleId == 'student') {
          await loadSessionAttendanceData(
            userData.schoolId,
            userData.currentBranch,
            activeUID,
            schoolData.currentSession
          );
          await loadAttendanceStudent(
            activeUID,
            userData.className,
            userData.section,
            userData.schoolId,
            userData.currentBranch
          );
        } else await loadAttendanceEmployee(activeUID, userData.schoolId, userData.currentBranch);
        await updateAccountProfile(activeUID, {
          name: userData.name,
          role: userData.role?.toLowerCase(),
          roleName: userData.role?.toLowerCase(),
          appId: userData.roleId === 'student' ? userData.appId : userData.employeeId,
        });
        setSchoolUser({
          ...userData,
          uid: activeUID,
          currentSession: schoolData.currentSession,
          schoolName: schoolData.name,
          schoolAddress: `${schoolData.city ? `${schoolData.city}, ` : ''} ${schoolData.state ? `${schoolData.state}` : ''}`,
          schoolCode: schoolData.code,
          roleId: userData.roleId,
          roleName: userData.role?.toLowerCase(),
          permissions: roleData ? roleData.permissions || [] : [],
        });
        setAuthState('ready');
      } catch (error) {
        console.log('Failed AuthContext: ' + error);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    });
    return unsub;
  }, []);
  return (
    <AuthContext.Provider
      value={{
        schoolUser,
        authState,
        setAuthState,
        loading,
        isLoaded,
        classData,
        subjectData,
        employeeData,
        handleSignOut,
        handleSwitch,
        sessionAttData,
        attendance,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
