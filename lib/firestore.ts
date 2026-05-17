import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile, onAuthStateChanged,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { auth, db, storage } from './firebase';
import type { UserProfile, GoalType } from './types';

async function waitForAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  return new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); });
  });
}

async function getUserDoc(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: uid, ...snap.data() } as UserProfile;
}

async function ensureUserDoc(u: User) {
  const ref2 = doc(db, 'users', u.uid);
  const snap = await getDoc(ref2);
  if (snap.exists()) return;
  await setDoc(ref2, {
    email: u.email ?? '',
    name: u.displayName ?? '',
    full_name: u.displayName ?? '',
    profilePhoto: u.photoURL ?? '',
    onboardingComplete: false,
    role: 'member',
    userRole: 'Member',
    chapterId: null,
    created_date: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
}

function toSort(sortStr: string) {
  if (!sortStr) return null;
  const desc = sortStr.startsWith('-');
  const field = sortStr.replace(/^-/, '');
  return { field, direction: desc ? 'desc' as const : 'asc' as const };
}

function makeEntity(collectionName: string) {
  return {
    async create(data: Record<string, unknown>) {
      const u = await waitForAuth();
      if (!u) throw new Error('Not authenticated');
      const payload = {
        ...data,
        created_date: data?.created_date ?? new Date().toISOString(),
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, collectionName), payload);
      return { id: docRef.id, ...payload };
    },

    async update(id: string, data: Record<string, unknown>) {
      await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
      const snap = await getDoc(doc(db, collectionName, id));
      return { id, ...snap.data() };
    },

    async delete(id: string) {
      await deleteDoc(doc(db, collectionName, id));
    },

    async list(sortStr = '-created_date', max = 100) {
      const sort = toSort(sortStr);
      const parts = [];
      if (sort) parts.push(orderBy(sort.field, sort.direction));
      if (max) parts.push(limit(max));
      const q = query(collection(db, collectionName), ...parts);
      const snaps = await getDocs(q);
      return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async filter(filterObj: Record<string, unknown> = {}, sortStr = '-created_date', max = 100) {
      const sort = toSort(sortStr);
      const parts = [];
      for (const [k, v] of Object.entries(filterObj)) {
        if (v === undefined) continue;
        parts.push(where(k, '==', v));
      }
      if (sort) parts.push(orderBy(sort.field, sort.direction));
      if (max) parts.push(limit(max));
      const q = query(collection(db, collectionName), ...parts);
      const snaps = await getDocs(q);
      return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  };
}

export const Auth = {
  async me(): Promise<UserProfile> {
    const u = await waitForAuth();
    if (!u) throw new Error('Not authenticated');
    await ensureUserDoc(u);
    const profile = await getUserDoc(u.uid);
    const displayName = profile?.full_name ?? profile?.name ?? u.displayName ?? '';
    return {
      id: u.uid,
      email: u.email ?? '',
      name: displayName,
      profilePhoto: u.photoURL ?? '',
      ...profile,
      full_name: displayName,
    } as UserProfile;
  },

  async updateMe(patch: Partial<UserProfile>) {
    const u = await waitForAuth();
    if (!u) throw new Error('Not authenticated');
    const authPatch: { displayName?: string; photoURL?: string } = {};
    if (patch.name) authPatch.displayName = patch.name;
    if (patch.full_name) authPatch.displayName = patch.full_name;
    if (patch.profilePhoto) authPatch.photoURL = patch.profilePhoto;
    if (Object.keys(authPatch).length) await updateProfile(u, authPatch);
    await updateDoc(doc(db, 'users', u.uid), {
      ...patch,
      ...(patch.name && !patch.full_name ? { full_name: patch.name } : {}),
      updatedAt: serverTimestamp(),
    });
    return this.me();
  },

  async loginWithEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(cred.user);
    return this.me();
  },

  async signUpWithEmail(email: string, password: string, profile: { name?: string } = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (profile.name) await updateProfile(cred.user, { displayName: profile.name });
    await ensureUserDoc(cred.user);
    if (profile.name) {
      await updateDoc(doc(db, 'users', cred.user.uid), {
        name: profile.name, full_name: profile.name,
      });
    }
    return this.me();
  },

  async logout() {
    await signOut(auth);
  },

  isAuthenticated() {
    return !!auth.currentUser;
  },
};

export const Entities = {
  Student: makeEntity('students'),
  EvangelismSession: makeEntity('sessions'),
  NewsPost: makeEntity('news'),
  Goal: makeEntity('goals'),
  StudentChat: makeEntity('studentChats'),
  Chapter: makeEntity('chapters'),

  User: {
    async list() {
      const snaps = await getDocs(
        query(collection(db, 'users'), orderBy('created_date', 'desc'))
      );
      return snaps.docs.map((d) => ({ id: d.id, ...d.data() })) as UserProfile[];
    },
    async update(id: string, data: Partial<UserProfile>) {
      await updateDoc(doc(db, 'users', id), { ...data, updatedAt: serverTimestamp() });
      const snap = await getDoc(doc(db, 'users', id));
      return { id, ...snap.data() } as UserProfile;
    },
  },
};

export async function getStudentById(id: string) {
  const snap = await getDoc(doc(db, 'students', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Record<string, unknown>;
}

export async function uploadFile(file: { uri: string; name?: string; type?: string }) {
  const u = await waitForAuth();
  if (!u) throw new Error('Not authenticated');
  const safeName = `${Date.now()}_${file.name ?? 'upload'}`;
  const storageRef = ref(storage, `uploads/${u.uid}/${safeName}`);
  const response = await fetch(file.uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function getGoalProgress(userId: string, type: GoalType): Promise<number> {
  const now = new Date();
  let since: Date;

  if (type === 'sessions_week' || type === 'hours_week') {
    since = new Date(now);
    since.setDate(now.getDate() - 7);
  } else {
    since = new Date(now);
    since.setDate(1);
  }

  if (type === 'sessions_week') {
    const snaps = await getDocs(
      query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(200)
      )
    );
    return snaps.size;
  }

  if (type === 'hours_week') {
    const snaps = await getDocs(
      query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(200)
      )
    );
    const totalMins = snaps.docs.reduce(
      (sum, d) => sum + ((d.data().durationMinutes as number) ?? 0),
      0
    );
    return Math.round((totalMins / 60) * 10) / 10;
  }

  if (type === 'students_month') {
    const snaps = await getDocs(
      query(
        collection(db, 'students'),
        where('evangelizedByUserId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(200)
      )
    );
    return snaps.size;
  }

  if (type === 'bible_studies_month') {
    const snaps = await getDocs(
      query(
        collection(db, 'students'),
        where('evangelizedByUserId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(200)
      )
    );
    return snaps.docs.filter((d) => {
      const topics = (d.data().bibleStudyTopics ?? []) as { completed: boolean }[];
      return topics.some((t) => t.completed);
    }).length;
  }

  return 0;
}
