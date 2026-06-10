"use client";

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseClient, isFirebaseConfigured } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const { auth } = getFirebaseClient();
    return onAuthStateChanged(auth, (nextUser: User | null) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: isFirebaseConfigured,
    login: async () => {
      const { auth } = getFirebaseClient();
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    logout: async () => signOut(getFirebaseClient().auth),
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
