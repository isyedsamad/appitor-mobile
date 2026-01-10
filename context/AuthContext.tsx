import { db } from "@/lib/firebase";
import { logout, subscribeToAuthChanges } from "@/services/auth.service";
import { doc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  schoolUser: any | null;
  setLoading: any;
  loading: boolean;
  isLoaded: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [schoolUser, setSchoolUser] = useState(null as any);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (firebaseUser) => {
      if(!firebaseUser) {
        setSchoolUser(null);
        setLoading(false);
        setIsLoaded(true);
        return;
      }
      try {
        const userSnap = await getDoc(doc(db, "schoolUsers", firebaseUser.uid));
        if(!userSnap.exists()) {
          setSchoolUser(null);
          await logout();
          return;
        }
        const userData = userSnap.data();
        if(userData.status == "disabled") {
          setSchoolUser(null);
          await logout();
          return;
        }
        const schoolSnap = await getDoc(doc(db, "schools", userData.schoolId));
        if(!schoolSnap.exists()) {
          setSchoolUser(null);
          await logout();
          return;
        }
        const schoolData = schoolSnap.data();
        if(schoolData.status != "active") {
          setSchoolUser(null);
          await logout();
          return;
        }
        const roleSnap = await getDoc(
          doc(db, "roles", userData.roleId)
        );
        if (!roleSnap.exists()) {
          setSchoolUser(null);
          await logout();
          return;
        }
        const roleData = roleSnap.data();
        setSchoolUser({
          ...userData,
          uid: firebaseUser.uid,
          currentSession: schoolData.currentSession,
          schoolName: schoolData.name,
          schoolCode: schoolData.code,
          roleId: userData.roleId,
          roleName: userData.role?.toLowerCase(),
          permissions: roleData.permissions || [],
        });
      } catch (error) {
        console.log("Failed AuthContext: " + error);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    });
    return unsub;
  }, []);
  return (
    <AuthContext.Provider value={{ schoolUser, setLoading, loading, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
