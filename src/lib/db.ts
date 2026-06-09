import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, limit, where, serverTimestamp, addDoc,
  deleteDoc, type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, Student, EvangelismSession, NewsPost, Goal, Chapter } from './types';

// ─── Generic helpers ──────────────────────────────────────────────────────────

function col(path: string) { return collection(db, path); }
function ref(path: string, id: string) { return doc(db, path, id); }

async function listDocs<T>(
  path: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const snap = await getDocs(query(col(path), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const UserDB = {
  async get(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(ref('users', uid));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
  },
  async ensureDoc(u: { uid: string; email?: string | null; displayName?: string | null }) {
    const r = ref('users', u.uid);
    const snap = await getDoc(r);
    if (!snap.exists()) {
      await setDoc(r, {
        email: u.email ?? '',
        name: u.displayName ?? '',
        full_name: u.displayName ?? '',
        created_date: new Date().toISOString(),
      });
    }
  },
  async update(uid: string, patch: Partial<UserProfile>) {
    await updateDoc(ref('users', uid), patch as Record<string, unknown>);
  },
  async list(): Promise<UserProfile[]> {
    return listDocs<UserProfile>('users', [orderBy('created_date', 'desc')]);
  },
};

// ─── Students ─────────────────────────────────────────────────────────────────

export const StudentDB = {
  async list(sortBy = '-created_date', max = 200): Promise<Student[]> {
    const field = sortBy.replace('-', '');
    const dir = sortBy.startsWith('-') ? 'desc' : 'asc';
    return listDocs<Student>('students', [orderBy(field, dir), limit(max)]);
  },
  async getById(id: string): Promise<Student | null> {
    const snap = await getDoc(ref('students', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Student) : null;
  },
  async create(data: Omit<Student, 'id'>): Promise<string> {
    const d = await addDoc(col('students'), { ...data, created_date: new Date().toISOString() });
    return d.id;
  },
  async update(id: string, patch: Partial<Student>) {
    await updateDoc(ref('students', id), patch as Record<string, unknown>);
  },
  async delete(id: string) {
    await deleteDoc(ref('students', id));
  },
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const SessionDB = {
  async list(sortBy = '-created_date', max = 200): Promise<EvangelismSession[]> {
    const field = sortBy.replace('-', '');
    const dir = sortBy.startsWith('-') ? 'desc' : 'asc';
    return listDocs<EvangelismSession>('sessions', [orderBy(field, dir), limit(max)]);
  },
  async create(data: Omit<EvangelismSession, 'id'>): Promise<string> {
    const d = await addDoc(col('sessions'), { ...data, created_date: new Date().toISOString() });
    return d.id;
  },
  async update(id: string, patch: Partial<EvangelismSession>) {
    await updateDoc(ref('sessions', id), patch as Record<string, unknown>);
  },
};

// ─── News ─────────────────────────────────────────────────────────────────────

export const NewsDB = {
  async list(max = 50): Promise<NewsPost[]> {
    return listDocs<NewsPost>('news', [orderBy('created_date', 'desc'), limit(max)]);
  },
  async create(data: Omit<NewsPost, 'id'>): Promise<string> {
    const d = await addDoc(col('news'), { ...data, created_date: new Date().toISOString() });
    return d.id;
  },
  async delete(id: string) {
    await deleteDoc(ref('news', id));
  },
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export const GoalDB = {
  async list(chapterId?: string): Promise<Goal[]> {
    const constraints: QueryConstraint[] = [orderBy('created_date', 'desc')];
    if (chapterId) constraints.unshift(where('chapterId', '==', chapterId));
    return listDocs<Goal>('goals', constraints);
  },
  async create(data: Omit<Goal, 'id'>): Promise<string> {
    const d = await addDoc(col('goals'), { ...data, created_date: new Date().toISOString() });
    return d.id;
  },
  async update(id: string, patch: Partial<Goal>) {
    await updateDoc(ref('goals', id), patch as Record<string, unknown>);
  },
  async delete(id: string) {
    await deleteDoc(ref('goals', id));
  },
};

// ─── Chapters ─────────────────────────────────────────────────────────────────

export const ChapterDB = {
  async list(): Promise<Chapter[]> {
    return listDocs<Chapter>('chapters', [orderBy('name')]);
  },
  async create(data: Omit<Chapter, 'id'>): Promise<string> {
    const d = await addDoc(col('chapters'), data);
    return d.id;
  },
};
