'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { StudentDB, SessionDB, GoalDB } from '@/lib/db';
import type { Student, EvangelismSession, Goal } from '@/lib/types';
import Link from 'next/link';

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

function getRangeStart(range: TimeRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  const d = new Date(now);
  if (range === 'week') d.setDate(d.getDate() - 7);
  else if (range === 'month') d.setMonth(d.getMonth() - 1);
  else if (range === 'quarter') d.setMonth(d.getMonth() - 3);
  else if (range === 'year') d.setFullYear(d.getFullYear() - 1);
  return d;
}

const PIPELINE_BADGE: Record<string, string> = {
  'Initial Contact': 'bg-slate-100 text-slate-600',
  'Follow Up': 'bg-amber-100 text-amber-700',
  'Bible Study': 'bg-blue-100 text-blue-700',
  'Committed': 'bg-green-100 text-green-700',
  'Baptized': 'bg-purple-100 text-purple-700',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const { data: allStudents = [], isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => StudentDB.list(),
  });

  const { data: allSessions = [], isLoading: loadingSessions } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionDB.list(),
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => GoalDB.list(user?.chapterId),
  });

  const rangeStart = getRangeStart(timeRange);

  const myStudents = useMemo(() => {
    let s = allStudents.filter((x) => x.evangelizedByUserId === user?.id);
    if (rangeStart) s = s.filter((x) => new Date(x.created_date) >= rangeStart);
    return s;
  }, [allStudents, user, rangeStart]);

  const mySessions = useMemo(() => {
    let s = allSessions.filter((x) => x.userId === user?.id);
    if (rangeStart) s = s.filter((x) => new Date(x.created_date) >= rangeStart);
    return s;
  }, [allSessions, user, rangeStart]);

  const totalHours = useMemo(
    () => Math.round(mySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60 * 10) / 10,
    [mySessions],
  );

  const bibleStudies = useMemo(
    () => myStudents.filter((s) => ['Bible Study', 'Committed', 'Baptized'].includes(s.statusPipeline)).length,
    [myStudents],
  );

  const baptisms = useMemo(
    () => myStudents.filter((s) => s.statusPipeline === 'Baptized').length,
    [myStudents],
  );

  const recentStudents = useMemo(
    () => [...myStudents].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()).slice(0, 6),
    [myStudents],
  );

  const isLoading = loadingStudents || loadingSessions;

  const RANGE_LABELS: Record<TimeRange, string> = {
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
    year: 'This Year',
    all: 'All Time',
  };

  const stats = [
    { label: 'STUDENTS CONTACTED', value: myStudents.length, sub: 'initial contacts' },
    { label: 'BIBLE STUDIES', value: bibleStudies, sub: 'names recorded' },
    { label: 'SESSIONS', value: mySessions.length, sub: 'evangelism sessions' },
    { label: 'HOURS', value: totalHours, sub: 'time invested' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'friend'} 👋
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {user?.chapterName ? `${user.chapterName}` : 'Youth Evangelical Fellowship'}
          {user?.country ? ` · ${user.country}` : ''}
        </p>
      </div>

      {/* Time range selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(['week', 'month', 'quarter', 'year', 'all'] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              timeRange === r
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
            {isLoading ? (
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-gray-100" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-blue-700">{value}</p>
            )}
            <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Baptisms highlight */}
      {baptisms > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-5 py-4">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-purple-800">{baptisms} baptism{baptisms !== 1 ? 's' : ''} — praise God!</p>
            <p className="text-sm text-purple-600">Keep up the great work this {timeRange === 'all' ? 'season' : timeRange}.</p>
          </div>
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Chapter Goals</h2>
            <Link href="/goals" className="text-xs font-medium text-blue-700 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {goals.slice(0, 5).map((goal) => {
              const pct = goal.targetCount > 0 ? Math.min(Math.round(((goal.currentCount ?? 0) / goal.targetCount) * 100), 100) : 0;
              return (
                <div key={goal.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="min-w-0 flex-1 text-sm text-gray-700">{goal.title}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block w-32 h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      {goal.currentCount ?? 0} / {goal.targetCount} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent students */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Students</h2>
          <Link href="/students" className="text-xs font-medium text-blue-700 hover:underline">View all</Link>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-sm font-medium text-gray-500">No students yet</p>
            <p className="mt-1 text-xs text-gray-400">Head to Students to add your first contact</p>
            <Link
              href="/students"
              className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Add student
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentStudents.map((student) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{student.name}</p>
                  <p className="truncate text-xs text-gray-400">{student.universityName || student.email || '—'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${PIPELINE_BADGE[student.statusPipeline] || 'bg-gray-100 text-gray-600'}`}>
                  {student.statusPipeline}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
