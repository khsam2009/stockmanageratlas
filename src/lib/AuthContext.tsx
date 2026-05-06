"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { getUserProfile, bootstrapAdmin } from "./auth";
import type { AppUser, NavPage, PagePermission, PermissionLevel, UserPermissions } from "./types";

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  /** Returns true if the current user can access the given page with required level */
  canAccess: (page: PagePermission, requiredLevel?: PermissionLevel) => boolean;
  /** Get the permission level for a page */
  getPermissionLevel: (page: PagePermission) => PermissionLevel;
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
  getPermissionLevel: () => "none",
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
    (page: PagePermission, requiredLevel: PermissionLevel = "read"): boolean => {
      if (!appUser) return false;
      if (appUser.role === "admin") return true;
      const userLevel = appUser.permissions[page];
      if (requiredLevel === "write") return userLevel === "write";
      if (requiredLevel === "read") return userLevel === "read" || userLevel === "write";
      return userLevel !== "none";
    },
    [appUser]
  );

  const getPermissionLevel = useCallback(
    (page: PagePermission): PermissionLevel => {
      if (!appUser) return "none";
      if (appUser.role === "admin") return "write";
      return appUser.permissions[page];
    },
    [appUser]
  );

  const isAdmin = appUser?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ firebaseUser, appUser, loading, canAccess, getPermissionLevel, isAdmin, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedPage({ page, children }: { page: PagePermission; children: React.ReactNode }) {
  const { canAccess, isAdmin } = useAuth();
  
  if (isAdmin) {
    return <>{children}</>;
  }
  
  if (!canAccess(page, "read")) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
          Accès refusé
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b' }}>
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
          Contactez votre administrateur pour obtenir l&apos;accès.
        </p>
      </div>
    );
  }
  
  return <>{children}</>;
}
