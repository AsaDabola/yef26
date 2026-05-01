import { create } from 'zustand';

type SessionData = {
  startTime: string;
  studentIds: string[];
  notes: string;
  modeType: string;
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

  startEvangelizing: (data = {}) => {
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

  stopEvangelizing: () => {
    const { sessionData } = get();
    const endTime = new Date().toISOString();
    const durationMinutes = sessionData
      ? Math.round((new Date(endTime).getTime() - new Date(sessionData.startTime).getTime()) / 60000)
      : 0;
    set({ isEvangelizing: false, sessionData: null });
    return { ...(sessionData as SessionData), endTime, durationMinutes };
  },

  addStudentToSession: (studentId: string) => {
    const { sessionData } = get();
    if (!sessionData) return;
    set({
      sessionData: {
        ...sessionData,
        studentIds: [...sessionData.studentIds, studentId],
      },
    });
  },
}));
