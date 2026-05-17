/**
 * Firestore helpers + Auth operations.
 * Kept intentionally thin: each function does exactly one thing.
 */
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
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, GoalType } from './types';

// ─── Low-level helpers ────────────────────────────────────────────────────────

function parseSortStr(s: string): QueryConstraint | null {
  if (!s) return null;
  const desc = s.startsWith('-');
  const field = s.replace(/^-/, '');
  return orderBy(field, desc ? 'desc' : 'asc');
}

/** Generic CRUD factory for a Firestore collection. */
export function makeEntity(col: string) {
  return {
    async create(data: Record<string, unknown>) {
      const payload = {
        ...data,
        created_date: data.created_date ?? new Date().toISOString(),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, col), payload);
      return { id: ref.id, ...payload };
    },

    async update(id: string, data: Record<string, unknown>) {
      const ref = doc(db, col, id);
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
      const snap = await getDoc(ref);
      return { id, ...snap.data() };
    },

    async delete(id: string) {
      await deleteDoc(doc(db, col, id));
    },

    async getById(id: string) {
      const snap = await getDoc(doc(db, col, id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    async list(sort = '-created_date', max = 200) {
      const constraints: QueryConstraint[] = [];
      const s = parseSortStr(sort);
      if (s) constraints.push(s);
      if (max) constraints.push(limit(max));
      const snaps = await getDocs(query(collection(db, col), ...constraints));
      return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async filter(
      filters: Record<string, unknown>,
      sort = '-created_date',
      max = 200,
    ) {
      const constraints: QueryConstraint[] = [];
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null) constraints.push(where(k, '==', v));
      }
      const s = parseSortStr(sort);
      if (s) constraints.push(s);
      if (max) constraints.push(limit(max));
      const snaps = await getDocs(query(collection(db, col), ...constraints));
      return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  };
}

// ─── Collections ─────────────────────────────────────────────────────────────

export const StudentDB = makeEntity('students');
export const SessionDB = makeEntity('sessions');
export const NewsDB = makeEntity('news');
export const GoalDB = makeEntity('goals');
export const ChatDB = makeEntity('studentChats');
export const ChapterDB = makeEntity('chapters');

// ─── Users (custom because we control the doc id) ────────────────────────────

export const UserDB = {
  async get(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? ({ id: uid, ...snap.data() } as UserProfile) : null;
  },

  async ensureDoc(u: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, {
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
  },

  async update(uid: string, data: Partial<UserProfile>) {
    await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
    return this.get(uid);
  },

  async list(): Promise<UserProfile[]> {
    const snaps = await getDocs(
      query(collection(db, 'users'), orderBy('created_date', 'desc'), limit(500)),
    );
    return snaps.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
  },
};

// ─── Goal progress calculation ─────────────────────────────────────────────────

export async function getGoalProgress(userId: string, type: GoalType): Promise<number> {
  const now = new Date();
  const isWeekly = type === 'sessions_week' || type === 'hours_week';
  const since = new Date(now);
  if (isWeekly) since.setDate(now.getDate() - 7);
  else since.setDate(1); // start of month

  if (type === 'sessions_week') {
    const snaps = await getDocs(
      query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(500),
      ),
    );
    return snaps.size;
  }

  if (type === 'hours_week') {
    const snaps = await getDocs(
      query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(500),
      ),
    );
    const mins = snaps.docs.reduce((s, d) => s + ((d.data().durationMinutes as number) || 0), 0);
    return Math.round((mins / 60) * 10) / 10;
  }

  if (type === 'students_month') {
    const snaps = await getDocs(
      query(
        collection(db, 'students'),
        where('evangelizedByUserId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(500),
      ),
    );
    return snaps.size;
  }

  if (type === 'bible_studies_month') {
    const snaps = await getDocs(
      query(
        collection(db, 'students'),
        where('evangelizedByUserId', '==', userId),
        where('created_date', '>=', since.toISOString()),
        limit(500),
      ),
    );
    return snaps.docs.filter((d) => {
      const topics = (d.data().bibleStudyTopics || []) as { completed: boolean }[];
      return topics.some((t) => t.completed);
    }).length;
  }

  return 0;
}
