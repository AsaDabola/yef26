'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { UserDB } from './db';
import type { UserProfile } from './types';

type AuthCtx = {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function buildProfile(uid: string, email: string, displayName?: string | null): Promise<UserProfile> {
  await UserDB.ensureDoc({ uid, email, displayName });
  const doc = await UserDB.get(uid);
  return {
    id: uid,
    email,
    name: doc?.full_name ?? doc?.name ?? displayName ?? '',
    full_name: doc?.full_name ?? doc?.name ?? displayName ?? '',
    ...doc,
  } as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      if (fu) {
        try {
          const p = await buildProfile(fu.uid, fu.email ?? '', fu.displayName);
          setUser(p);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await buildProfile(cred.user.uid, cred.user.email ?? '', cred.user.displayName);
    setUser(p);
  }

  async function signup(email: string, password: string, name: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await UserDB.ensureDoc({ uid: cred.user.uid, email, displayName: name });
    await UserDB.update(cred.user.uid, { name, full_name: name });
    const p = await buildProfile(cred.user.uid, email, name);
    setUser(p);
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  async function refreshUser() {
    const fu = auth.currentUser;
    if (!fu) { setUser(null); return; }
    const p = await buildProfile(fu.uid, fu.email ?? '', fu.displayName);
    setUser(p);
  }

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
