import { create } from 'zustand';

type SessionData = {
  startTime: string;
  studentIds: string[];
  notes: string;
  modeType: 'Individual' | 'Group';
  locationName: string;
};

type EvangelizingStore = {
  isEvangelizing: boolean;
  sessionData: SessionData | null;
  startEvangelizing: (data?: Partial<SessionData>) => void;
  stopEvangelizing: () => SessionData & { endTime: string; durationMinutes: number };
  addStudentToSession: (studentId: string) => void;
};

export const useEvangelizing = create<EvangelizingStore>((set, get) => ({
  isEvangelizing: false,
  sessionData: null,

  startEvangelizing(data = {}) {
    set({
      isEvangelizing: true,
      sessionData: {
        startTime: new Date().toISOString(),
        studentIds: [],
        notes: '',
        modeType: 'Individual',
        locationName: '',
        ...data,
      },
    });
  },

  stopEvangelizing() {
    const { sessionData } = get();
    if (!sessionData) throw new Error('No active session');
    const endTime = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(endTime).getTime() - new Date(sessionData.startTime).getTime()) / 60000
    );
    set({ isEvangelizing: false, sessionData: null });
    return { ...sessionData, endTime, durationMinutes };
  },

  addStudentToSession(studentId: string) {
    set((s) => {
      if (!s.sessionData) return s;
      if (s.sessionData.studentIds.includes(studentId)) return s;
      return {
        sessionData: {
          ...s.sessionData,
          studentIds: [...s.sessionData.studentIds, studentId],
        },
      };
    });
  },
}));
