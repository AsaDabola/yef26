/**
 * Firebase Auth initialised here (once) so AsyncStorage is ready
 * before the module loads on native.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { app } from './firebase';
import { UserDB } from './db';
import type { UserProfile } from './types';

// ─── Singleton auth instance ──────────────────────────────────────────────────

let _auth: ReturnType<typeof getAuth> | null = null;

function getFirebaseAuth() {
  if (_auth) return _auth;
  try {
    if (Platform.OS === 'web') {
      _auth = initializeAuth(app, { persistence: browserLocalPersistence });
    } else {
      // Dynamic require keeps AsyncStorage out of the web bundle
      const { getReactNativePersistence } = require('firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      _auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    }
  } catch {
    _auth = getAuth(app);
  }
  return _auth;
}

export const firebaseAuth = getFirebaseAuth();

// ─── Auth operations ──────────────────────────────────────────────────────────

async function buildProfile(u: User): Promise<UserProfile> {
  await UserDB.ensureDoc(u);
  const doc = await UserDB.get(u.uid);
  const displayName = doc?.full_name ?? doc?.name ?? u.displayName ?? '';
  return {
    id: u.uid,
    email: u.email ?? '',
    name: displayName,
    full_name: displayName,
    profilePhoto: u.photoURL ?? '',
    ...doc,
  } as UserProfile;
}

export const AuthActions = {
  async loginWithEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return buildProfile(cred.user);
  },

  async signUpWithEmail(email: string, password: string, name?: string) {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await UserDB.ensureDoc({ ...cred.user, displayName: name ?? cred.user.displayName });
    if (name) await UserDB.update(cred.user.uid, { name, full_name: name });
    return buildProfile(cred.user);
  },

  async updateProfile(uid: string, patch: Partial<UserProfile>) {
    const u = firebaseAuth.currentUser;
    if (u && u.uid === uid) {
      const authPatch: { displayName?: string; photoURL?: string } = {};
      if (patch.full_name) authPatch.displayName = patch.full_name;
      else if (patch.name) authPatch.displayName = patch.name;
      if (patch.profilePhoto) authPatch.photoURL = patch.profilePhoto;
      if (Object.keys(authPatch).length) await updateProfile(u, authPatch);
    }
    return UserDB.update(uid, {
      ...patch,
      ...(patch.name && !patch.full_name ? { full_name: patch.name } : {}),
    });
  },

  async logout() {
    await signOut(firebaseAuth);
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

type AuthCtx = {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!mounted.current) return;
      if (firebaseUser) {
        try {
          const profile = await buildProfile(firebaseUser);
          if (mounted.current) setUser(profile);
        } catch {
          if (mounted.current) setUser(null);
        }
      } else {
        if (mounted.current) setUser(null);
      }
      if (mounted.current) setLoading(false);
    });
    return () => {
      mounted.current = false;
      unsub();
    };
  }, []);

  async function refreshUser() {
    const u = firebaseAuth.currentUser;
    if (!u) { setUser(null); return; }
    try {
      const profile = await buildProfile(u);
      setUser(profile);
    } catch {
      setUser(null);
    }
  }

  async function logout() {
    await AuthActions.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
