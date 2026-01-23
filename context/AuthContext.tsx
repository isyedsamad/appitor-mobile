import { auth, db } from '@/lib/firebase';
import { logout, subscribeToAuthChanges } from '@/services/auth.service';
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
};

const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [schoolUser, setSchoolUser] = useState(null as any);
  const [sessionAttData, setSessionAttData] = useState(null as any);
  const [classData, setClassData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to SignOut',
        text2: 'Error: ' + error,
      });
      console.error('Error signing out:', error);
    }
  }
  async function handleSwitch() {
    try {
      await signOut(auth);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to SignOut',
        text2: 'Error: ' + error,
      });
      console.error('Error signing out:', error);
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
  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (firebaseUser) => {
      setLoading(true);
      setIsLoaded(false);
      if (!firebaseUser) {
        setSchoolUser(null);
        setLoading(false);
        setIsLoaded(true);
        return;
      }
      try {
        const userSnap = await getDoc(doc(db, 'schoolUsers', firebaseUser.uid));
        if (!userSnap.exists()) {
          setSchoolUser(null);
          await logout();
          return;
        }
        const userData = userSnap.data();
        if (userData.status == 'disabled') {
          setSchoolUser(null);
          await logout();
          return;
        }
        const schoolSnap = await getDoc(doc(db, 'schools', userData.schoolId));
        if (!schoolSnap.exists()) {
          setSchoolUser(null);
          await logout();
          return;
        }
        const schoolData = schoolSnap.data();
        if (schoolData.status != 'active') {
          setSchoolUser(null);
          await logout();
          return;
        }
        let roleData = null;
        if (userData.roleId != 'student') {
          const roleSnap = await getDoc(doc(db, 'roles', userData.roleId));
          if (!roleSnap.exists()) {
            setSchoolUser(null);
            await logout();
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
            userData.uid,
            schoolData.currentSession
          );
        }
        setSchoolUser({
          ...userData,
          uid: firebaseUser.uid,
          currentSession: schoolData.currentSession,
          schoolName: schoolData.name,
          schoolCode: schoolData.code,
          roleId: userData.roleId,
          roleName: userData.role?.toLowerCase(),
          permissions: roleData ? roleData.permissions || [] : [],
        });
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
        loading,
        isLoaded,
        classData,
        subjectData,
        employeeData,
        handleSignOut,
        handleSwitch,
        sessionAttData,
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
