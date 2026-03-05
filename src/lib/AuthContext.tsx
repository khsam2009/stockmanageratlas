"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { getUserProfile, bootstrapAdmin } from "./auth";
import type { AppUser, NavPage, PagePermission } from "./types";

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  /** Returns true if the current user can access the given page */
  canAccess: (page: PagePermission) => boolean;
  /** Returns true if the current user is an admin */
  isAdmin: boolean;
  /** Refresh the user profile from Firestore */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  canAccess: () => false,
  isAdmin: false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Bootstrap admin account once on mount
  useEffect(() => {
    bootstrapAdmin()
      .catch(() => {
        // Ignore bootstrap errors (e.g., no network)
      })
      .finally(() => setBootstrapped(true));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid);
    setAppUser(profile);
  }, [firebaseUser]);

  useEffect(() => {
    if (!bootstrapped) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setAppUser(profile);
        } catch {
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [bootstrapped]);

  const canAccess = useCallback(
    (page: PagePermission): boolean => {
      if (!appUser) return false;
      if (appUser.role === "admin") return true;
      return appUser.permissions.includes(page);
    },
    [appUser]
  );

  const isAdmin = appUser?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ firebaseUser, appUser, loading, canAccess, isAdmin, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
