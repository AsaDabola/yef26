// Compatibility wrapper: the app was generated for Base44.
// We keep the same `base44` API shape, but back it with Firebase.

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { auth, db, storage } from './firebase';
import { createPageUrl } from '@/utils';

// ----- Helpers -----

function toBase44Sort(sortStr) {
  // Base44 uses '-created_date'. We'll accept both created_date and createdAt.
  if (!sortStr) return null;
  const desc = sortStr.startsWith('-');
  const field = sortStr.replace(/^-/, '');
  return { field, direction: desc ? 'desc' : 'asc' };
}

async function waitForAuthInit() {
  // Ensures auth state is resolved at least once.
  if (auth.currentUser) return auth.currentUser;
  return await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: uid, ...snap.data() };
}

async function ensureUserDoc(u) {
  const userRef = doc(db, 'users', u.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;
  await setDoc(userRef, {
    email: u.email ?? '',
    name: u.displayName ?? '',
    full_name: u.displayName ?? '',
    profilePhoto: u.photoURL ?? '',
    onboardingComplete: false,
    role: 'member',
    chapterId: null,
    created_date: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
}

function makeEntity(collectionName) {
  return {
    async create(data) {
      const u = await waitForAuthInit();
      if (!u) throw new Error('Not authenticated');
      const payload = {
        ...data,
        created_date: data?.created_date ?? new Date().toISOString(),
        createdAt: serverTimestamp(),
      };
      const refDoc = await addDoc(collection(db, collectionName), payload);
      return { id: refDoc.id, ...payload };
    },

    async update(id, data) {
      const u = await waitForAuthInit();
      if (!u) throw new Error('Not authenticated');
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(doc(db, collectionName, id));
      return { id, ...snap.data() };
    },

    async delete(id) {
      const u = await waitForAuthInit();
      if (!u) throw new Error('Not authenticated');
      await deleteDoc(doc(db, collectionName, id));
      return { ok: true };
    },

    async list(sortStr = '-created_date', max = 100) {
      const sort = toBase44Sort(sortStr);
      const qParts = [];
      if (sort) qParts.push(orderBy(sort.field, sort.direction));
      if (max) qParts.push(limit(max));
      const qy = query(collection(db, collectionName), ...qParts);
      const snaps = await getDocs(qy);
      return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async filter(filterObj = {}, sortStr = '-created_date', max = 100) {
      // Supports simple equality filters: { field: value, ... }
      const sort = toBase44Sort(sortStr);
      const qParts = [];
      for (const [k, v] of Object.entries(filterObj || {})) {
        if (v === undefined) continue;
        qParts.push(where(k, '==', v));
      }
      if (sort) qParts.push(orderBy(sort.field, sort.direction));
      if (max) qParts.push(limit(max));
      const qy = query(collection(db, collectionName), ...qParts);
      const snaps = await getDocs(qy);
      return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  };
}

// ----- Base44-compatible API -----

export const base44 = {
  auth: {
    async isAuthenticated() {
      const u = await waitForAuthInit();
      return !!u;
    },

    redirectToLogin() {
      window.location.href = createPageUrl('Login');
    },

    async me() {
      const u = await waitForAuthInit();
      if (!u) throw new Error('Not authenticated');
      await ensureUserDoc(u);
      const profile = await getUserProfile(u.uid);
      // Include a couple convenient fields similar to Base44
      const displayName = profile?.full_name ?? profile?.name ?? u.displayName ?? '';
      return {
        id: u.uid,
        email: u.email ?? profile?.email ?? '',
        name: displayName,
        profilePhoto: profile?.profilePhoto ?? u.photoURL ?? '',
        ...profile,
        full_name: displayName,
      };
    },

    async updateMe(patch) {
      const u = await waitForAuthInit();
      if (!u) throw new Error('Not authenticated');

      // Keep Firebase Auth displayName/photoURL in sync when provided
      const authPatch = {};
      if (typeof patch?.name === 'string') authPatch.displayName = patch.name;
      if (typeof patch?.full_name === 'string') authPatch.displayName = patch.full_name;
      if (typeof patch?.profilePhoto === 'string') authPatch.photoURL = patch.profilePhoto;
      if (Object.keys(authPatch).length) {
        await updateProfile(u, authPatch);
      }

      await updateDoc(doc(db, 'users', u.uid), {
        ...patch,
        ...(patch?.name && !patch?.full_name ? { full_name: patch.name } : {}),
        updatedAt: serverTimestamp(),
      });
      return await this.me();
    },

    async loginWithEmail(email, password) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user);
      return await this.me();
    },

    async signUpWithEmail(email, password, profile = {}) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (profile?.name || profile?.profilePhoto) {
        await updateProfile(cred.user, {
          displayName: profile?.name,
          photoURL: profile?.profilePhoto,
        });
      }
      await ensureUserDoc(cred.user);
      if (Object.keys(profile || {}).length) {
        await updateDoc(doc(db, 'users', cred.user.uid), {
          ...profile,
          ...(profile?.name ? { full_name: profile.name } : {}),
        });
      }
      return await this.me();
    },

    async logout() {
      await signOut(auth);
      return { ok: true };
    },
  },

  // Firestore-backed entities
  entities: {
    Student: makeEntity('students'),
    EvangelismSession: makeEntity('sessions'),
    NewsPost: makeEntity('news'),
    Goal: makeEntity('goals'),
    StudentChat: makeEntity('studentChats'),

    // "User" is special: reads from users collection. Create is not used in your UI; we expose list().
    User: {
      async list() {
        const snaps = await getDocs(query(collection(db, 'users'), orderBy('created_date', 'desc')));
        return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      async update(id, data) {
        await updateDoc(doc(db, 'users', id), { ...data, updatedAt: serverTimestamp() });
        const snap = await getDoc(doc(db, 'users', id));
        return { id, ...snap.data() };
      },
    },
    Chapter: makeEntity('chapters'),
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        const u = await waitForAuthInit();
        if (!u) throw new Error('Not authenticated');
        const safeName = `${Date.now()}_${file.name || 'upload'}`;
        const storageRef = ref(storage, `uploads/${u.uid}/${safeName}`);
        await uploadBytes(storageRef, file);
        const file_url = await getDownloadURL(storageRef);
        return { file_url };
      },
    },
  },

  appLogs: {
    async logUserInApp(pageName) {
      // Optional: record page views
      try {
        const u = await waitForAuthInit();
        if (!u) return;
        await addDoc(collection(db, 'appLogs'), {
          uid: u.uid,
          pageName,
          createdAt: serverTimestamp(),
          created_date: new Date().toISOString(),
        });
      } catch {
        // ignore
      }
    },
  },
};
