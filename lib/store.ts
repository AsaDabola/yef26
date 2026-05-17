import { create } from 'zustand';
import type { SessionMode } from './types';

type LiveSession = {
  startTime: string;
  modeType: SessionMode;
  locationName: string;
  studentIds: string[];
  notes: string;
};

type Store = {
  isEvangelizing: boolean;
  session: LiveSession | null;
  start: (opts?: { modeType?: SessionMode; locationName?: string }) => void;
  stop: () => LiveSession & { endTime: string; durationMinutes: number };
  addStudent: (id: string) => void;
};

export const useSessionStore = create<Store>((set, get) => ({
  isEvangelizing: false,
  session: null,

  start(opts = {}) {
    set({
      isEvangelizing: true,
      session: {
        startTime: new Date().toISOString(),
        modeType: opts.modeType ?? 'Individual',
        locationName: opts.locationName ?? '',
        studentIds: [],
        notes: '',
      },
    });
  },

  stop() {
    const { session } = get();
    if (!session) throw new Error('No active session');
    const endTime = new Date().toISOString();
    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - new Date(session.startTime).getTime()) / 60000),
    );
    set({ isEvangelizing: false, session: null });
    return { ...session, endTime, durationMinutes };
  },

  addStudent(id) {
    set((s) => {
      if (!s.session || s.session.studentIds.includes(id)) return s;
      return { session: { ...s.session, studentIds: [...s.session.studentIds, id] } };
    });
  },
}));
