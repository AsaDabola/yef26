export type UserRole = 'Member' | 'Evangelism Leader' | 'Admin';

export type PipelineStage =
  | 'Initial Contact'
  | 'Follow Up'
  | 'Bible Study'
  | 'Committed'
  | 'Baptized';

export const PIPELINE_STAGES: PipelineStage[] = [
  'Initial Contact',
  'Follow Up',
  'Bible Study',
  'Committed',
  'Baptized',
];

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  profilePhoto?: string;
  chapterId?: string;
  chapterName?: string;
  country?: string;
  university?: string;
  userRole?: UserRole;
  onboardingComplete?: boolean;
  created_date?: string;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  universityName?: string;
  course?: string;
  statusPipeline: PipelineStage;
  notes?: string;
  evangelizedByUserId: string;
  evangelizedByChapterId?: string;
  country?: string;
  bibleStudyTopics?: { topic: string; completed: boolean }[];
  created_date: string;
}

export interface EvangelismSession {
  id: string;
  userId: string;
  chapterId?: string;
  country?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  studentIds?: string[];
  created_date: string;
}

export interface NewsPost {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName?: string;
  chapterId?: string;
  global?: boolean;
  created_date: string;
}

export interface Goal {
  id: string;
  title: string;
  targetCount: number;
  currentCount?: number;
  type: 'sessions' | 'students' | 'bible_studies' | 'baptisms';
  chapterId?: string;
  userId?: string;
  deadline?: string;
  created_date: string;
}

export interface Chapter {
  id: string;
  name: string;
  country?: string;
  university?: string;
  leaderId?: string;
}
