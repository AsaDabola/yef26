// ─── Auth / Users ────────────────────────────────────────────────────────────

export type UserRole = 'Member' | 'Evangelism Leader' | 'Admin';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  full_name: string;
  profilePhoto?: string;
  bio?: string;
  role?: string;
  userRole?: UserRole;
  chapterId?: string;
  chapterName?: string;
  country?: string;
  state?: string;
  city?: string;
  onboardingComplete?: boolean;
  membershipStatus?: string;
  created_date?: string;
};

// ─── Students ─────────────────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  'Evangelized',
  'Contact Exchanged',
  'Bible Study Started',
  'Bible Study In Progress',
  'Visiting Fellowship',
  'Connected to Chapter',
  'Discipled/Serving',
  'Not Interested/Closed',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type BibleStudyTopic = { topic: string; completed: boolean };

export type Student = {
  id: string;
  name: string;
  universityName: string;
  phone: string;
  email: string;
  major?: string;
  collegeYear?: string;
  country: string;
  city?: string;
  notes?: string;
  statusPipeline: PipelineStage;
  bibleStudyTopics?: BibleStudyTopic[];
  evangelizedByUserId: string;
  evangelizedByUserName: string;
  evangelizedByChapterId: string;
  evangelizedByChapterName: string;
  created_date: string;
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type SessionMode = 'Individual' | 'Group';

export type EvangelismSession = {
  id: string;
  userId: string;
  userName: string;
  chapterId: string;
  chapterName: string;
  country: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  modeType: SessionMode;
  locationName: string;
  studentIds: string[];
  notes: string;
  created_date: string;
};

// ─── News ─────────────────────────────────────────────────────────────────────

export type NewsPost = {
  id: string;
  title: string;
  content: string;
  isGlobal: boolean;
  chapterId?: string;
  chapterName?: string;
  country: string;
  authorId: string;
  authorName: string;
  created_date: string;
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export type GoalType =
  | 'sessions_week'
  | 'hours_week'
  | 'students_month'
  | 'bible_studies_month';

export type Goal = {
  id: string;
  userId: string;
  type: GoalType;
  target: number;
  status: string;
  created_date: string;
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type StudentChat = {
  id: string;
  studentId: string;
  message: string;
  senderId: string;
  senderName: string;
  created_date: string;
};

// ─── Chapters ─────────────────────────────────────────────────────────────────

export type Chapter = {
  id: string;
  name: string;
  country: string;
  state?: string;
  city?: string;
  created_date: string;
};
