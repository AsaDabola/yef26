'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { StudentDB, SessionDB } from '@/lib/db';
import type { Student, EvangelismSession } from '@/lib/types';
import { Users, Calendar, Clock, BookOpen, ArrowRight } from 'lucide-react';

type Scope = 'local' | 'country' | 'global';
type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

const PIPELINE_BADGE: Record<string, string> = {
  'Initial Contact': 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  'Follow Up': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Bible Study': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Committed': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Baptized': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
};

const PIPELINE_DOT: Record<string, string> = {
  'Initial Contact': 'bg-slate-400',
  'Follow Up': 'bg-amber-400',
  'Bible Study': 'bg-blue-500',
  'Committed': 'bg-emerald-500',
  'Baptized': 'bg-violet-500',
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

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            value === opt
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {labels?.[opt] ?? opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
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
    () => students.filter((s) => ['Bible Study', 'Committed', 'Baptized'].includes(s.statusPipeline)).length,
    [students],
  );

  const recentStudents = useMemo(
    () => [...students].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()).slice(0, 8),
    [students],
  );

  const isLoading = loadingStudents || loadingSessions;

  const firstName = user?.name?.split(' ')[0] || 'friend';

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good day, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s your evangelism overview.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SegmentedControl
          options={['local', 'country', 'global'] as Scope[]}
          value={scope}
          onChange={setScope}
          labels={{ local: 'My Chapter', country: 'Country', global: 'Global' }}
        />
        <SegmentedControl
          options={['week', 'month', 'quarter', 'year', 'all'] as TimeRange[]}
          value={timeRange}
          onChange={setTimeRange}
          labels={{ week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year', all: 'All time' }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Students',
            value: students.length,
            icon: Users,
            bg: 'bg-indigo-600',
            soft: 'bg-indigo-50',
            text: 'text-indigo-600',
          },
          {
            label: 'Sessions',
            value: sessions.length,
            icon: Calendar,
            bg: 'bg-emerald-600',
            soft: 'bg-emerald-50',
            text: 'text-emerald-600',
          },
          {
            label: 'Hours',
            value: totalHours,
            icon: Clock,
            bg: 'bg-amber-500',
            soft: 'bg-amber-50',
            text: 'text-amber-600',
          },
          {
            label: 'Bible Studies',
            value: bibleStudies,
            icon: BookOpen,
            bg: 'bg-violet-600',
            soft: 'bg-violet-50',
            text: 'text-violet-600',
          },
        ].map(({ label, value, icon: Icon, soft, text }) => (
          <div key={label} className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${soft}`}>
              <Icon size={20} className={text} />
            </div>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            )}
            <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent students */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent Students</h2>
          <a
            href="/students"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
            <ArrowRight size={12} />
          </a>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No students yet</p>
            <p className="mt-1 text-xs text-slate-400">Add your first student to get started</p>
            <a
              href="/students"
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Add student
              <ArrowRight size={12} />
            </a>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentStudents.map((student) => (
              <a
                key={student.id}
                href={`/students/${student.id}`}
                className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-slate-50/80"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{student.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {student.universityName || student.email || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`h-1.5 w-1.5 rounded-full ${PIPELINE_DOT[student.statusPipeline] || 'bg-slate-400'}`} />
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PIPELINE_BADGE[student.statusPipeline] || 'bg-slate-100 text-slate-600'}`}>
                    {student.statusPipeline}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
