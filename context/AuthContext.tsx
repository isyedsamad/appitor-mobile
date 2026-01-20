import { db } from '@/lib/firebase';
import { logout, subscribeToAuthChanges } from '@/services/auth.service';
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
};

const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [schoolUser, setSchoolUser] = useState(null as any);
  const [classData, setClassData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
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
      value={{ schoolUser, loading, isLoaded, classData, subjectData, employeeData }}>
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
