'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { StudentDB, SessionDB } from '@/lib/db';
import type { Student, EvangelismSession } from '@/lib/types';
import { Users, Calendar, Clock, BookOpen, TrendingUp } from 'lucide-react';

type Scope = 'local' | 'country' | 'global';
type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

const PIPELINE_COLORS: Record<string, string> = {
  'Initial Contact': 'bg-slate-100 text-slate-700',
  'Follow Up': 'bg-yellow-100 text-yellow-700',
  'Bible Study': 'bg-blue-100 text-blue-700',
  'Committed': 'bg-green-100 text-green-700',
  'Baptized': 'bg-purple-100 text-purple-700',
};

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

export default function DashboardPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>('local');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const { data: allStudents = [], isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => StudentDB.list(),
  });

  const { data: allSessions = [], isLoading: loadingSessions } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionDB.list(),
  });

  const rangeStart = getRangeStart(timeRange);

  const students = useMemo(() => {
    let s = allStudents;
    if (scope === 'local') s = s.filter((x) => x.evangelizedByUserId === user?.id);
    else if (scope === 'country') s = s.filter((x) => x.country === user?.country);
    if (rangeStart) s = s.filter((x) => new Date(x.created_date) >= rangeStart);
    return s;
  }, [allStudents, scope, user, rangeStart]);

  const sessions = useMemo(() => {
    let s = allSessions;
    if (scope === 'local') s = s.filter((x) => x.userId === user?.id);
    else if (scope === 'country') s = s.filter((x) => x.country === user?.country);
    if (rangeStart) s = s.filter((x) => new Date(x.created_date) >= rangeStart);
    return s;
  }, [allSessions, scope, user, rangeStart]);

  const totalHours = useMemo(
    () => Math.round(sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60 * 10) / 10,
    [sessions],
  );

  const bibleStudies = useMemo(
    () => students.filter((s) => s.statusPipeline === 'Bible Study' || s.statusPipeline === 'Committed' || s.statusPipeline === 'Baptized').length,
    [students],
  );

  const recentStudents = useMemo(
    () => [...students].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()).slice(0, 8),
    [students],
  );

  const isLoading = loadingStudents || loadingSessions;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {user?.name || 'friend'}! Here&apos;s your evangelism overview.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(['local', 'country', 'global'] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                scope === s ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'local' ? 'My Chapter' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(['week', 'month', 'quarter', 'year', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                timeRange === r ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'all' ? 'All time' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Students', value: students.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Sessions', value: sessions.length, icon: Calendar, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Hours', value: totalHours, icon: Clock, color: 'bg-amber-50 text-amber-600' },
          { label: 'Bible Studies', value: bibleStudies, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            {isLoading ? (
              <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent students */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900">Recent Students</h2>
          </div>
          <a href="/students" className="text-xs font-medium text-blue-600 hover:underline">
            View all
          </a>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Users size={36} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No students yet</p>
            <p className="mt-1 text-xs text-slate-400">Add your first student to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentStudents.map((student) => (
              <a
                key={student.id}
                href={`/students/${student.id}`}
                className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{student.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {student.universityName || student.email || '—'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    PIPELINE_COLORS[student.statusPipeline] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {student.statusPipeline}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
