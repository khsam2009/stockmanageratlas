"use client";

import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { AppUser, CreateUserData, PagePermission } from "./types";

// ==================== USER PROFILE IN FIRESTORE ====================

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as AppUser;
}

export async function getAllUsers(): Promise<AppUser[]> {
  const q = query(collection(db, "users"), orderBy("displayName"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  })) as AppUser[];
}

// ==================== AUTH ACTIONS ====================

export async function loginUser(email: string, password: string): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile) {
    throw new Error("Profil utilisateur introuvable. Contactez l'administrateur.");
  }
  if (!profile.active) {
    await signOut(auth);
    throw new Error("Votre compte est désactivé. Contactez l'administrateur.");
  }
  return profile;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ==================== ADMIN: CREATE USER ====================

export async function createAppUser(data: CreateUserData): Promise<AppUser> {
  // Save current admin user before creating new account
  const currentUser = auth.currentUser;

  // Create Firebase Auth account
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await updateProfile(credential.user, { displayName: data.displayName });

  // Create Firestore profile
  const now = Timestamp.now();
  const profile: Omit<AppUser, "uid"> = {
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    permissions: data.permissions,
    active: true,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };

  await setDoc(doc(db, "users", credential.user.uid), {
    ...profile,
    createdAt: now,
    updatedAt: now,
  });

  // Sign back in as the admin (the createUserWithEmailAndPassword signs in as new user)
  if (currentUser?.email) {
    // We can't re-sign in without the password, so we just sign out the new user
    // The admin will need to re-login. Better approach: use Admin SDK on server side.
    // For client-side, we sign out and the AuthContext will redirect to login.
    await signOut(auth);
  }

  return { uid: credential.user.uid, ...profile };
}

// ==================== ADMIN: UPDATE USER ====================

export async function updateAppUser(
  uid: string,
  data: Partial<Pick<AppUser, "displayName" | "role" | "permissions" | "active">>
): Promise<void> {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAppUser(uid: string): Promise<void> {
  // Only delete Firestore profile (Firebase Auth deletion requires Admin SDK)
  await deleteDoc(doc(db, "users", uid));
}

// ==================== BOOTSTRAP ADMIN ====================

/**
 * Creates the default admin account if it doesn't exist yet.
 * Called once on app startup.
 */
export async function bootstrapAdmin(): Promise<void> {
  const ADMIN_EMAIL = "admin@stockmanager.com";
  const ADMIN_PASSWORD = "Admin@123";
  const ADMIN_NAME = "Administrateur";

  try {
    // Try to sign in — if it works, admin already exists
    const credential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const profile = await getUserProfile(credential.user.uid);

    if (!profile) {
      // Auth account exists but no Firestore profile — create it
      const allPages: PagePermission[] = [
        "dashboard",
        "mouvements",
        "reception",
        "sortie",
        "inventaire",
        "produits",
      ];
      const now = Timestamp.now();
      await setDoc(doc(db, "users", credential.user.uid), {
        email: ADMIN_EMAIL,
        displayName: ADMIN_NAME,
        role: "admin",
        permissions: allPages,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await signOut(auth);
  } catch {
    // Admin doesn't exist — create it
    try {
      const credential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      await updateProfile(credential.user, { displayName: ADMIN_NAME });

      const allPages: PagePermission[] = [
        "dashboard",
        "mouvements",
        "reception",
        "sortie",
        "inventaire",
        "produits",
      ];
      const now = Timestamp.now();
      await setDoc(doc(db, "users", credential.user.uid), {
        email: ADMIN_EMAIL,
        displayName: ADMIN_NAME,
        role: "admin",
        permissions: allPages,
        active: true,
        createdAt: now,
        updatedAt: now,
      });

      await signOut(auth);
    } catch {
      // Admin creation failed (e.g., already exists in Auth but wrong password) — ignore
    }
  }
}
