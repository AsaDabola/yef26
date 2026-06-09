'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { SessionDB } from '@/lib/db';
import type { EvangelismSession } from '@/lib/types';
import { Play, Square, Clock, Calendar, Users, MapPin } from 'lucide-react';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeStartTime, setActiveStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [location, setLocation] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: sessions = [], isLoading } = useQuery<EvangelismSession[]>({
    queryKey: ['sessions'],
    queryFn: () => SessionDB.list(),
  });

  useEffect(() => {
    if (activeStartTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeStartTime]);

  const startMutation = useMutation({
    mutationFn: async () => {
      const startTime = new Date().toISOString();
      const id = await SessionDB.create({
        userId: user!.id,
        chapterId: user?.chapterId,
        country: user?.country,
        location,
        startTime,
        created_date: startTime,
      });
      return { id, startTime };
    },
    onSuccess: ({ id, startTime }) => {
      setActiveSessionId(id);
      setActiveStartTime(new Date(startTime));
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!activeSessionId || !activeStartTime) return;
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - activeStartTime.getTime()) / 60000);
      await SessionDB.update(activeSessionId, {
        endTime: endTime.toISOString(),
        durationMinutes,
      });
    },
    onSuccess: () => {
      setActiveSessionId(null);
      setActiveStartTime(null);
      setLocation('');
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const isActive = !!activeSessionId;

  const mySessions = sessions.filter((s) => s.userId === user?.id);
  const totalHours = Math.round(
    mySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60 * 10,
  ) / 10;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        <p className="mt-1 text-sm text-slate-500">Track your evangelism sessions</p>
      </div>

      {/* Active session card */}
      <div className={`rounded-2xl p-6 shadow-sm ring-1 transition-all ${
        isActive ? 'bg-blue-600 ring-blue-500' : 'bg-white ring-slate-200'
      }`}>
        {isActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                <span className="text-sm font-semibold text-white">Session in progress</span>
              </div>
              <span className="text-xs text-blue-200">
                Started {activeStartTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center justify-center py-4">
              <span className="font-mono text-5xl font-bold tracking-wider text-white">
                {formatElapsed(elapsed)}
              </span>
            </div>

            <button
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:opacity-60"
            >
              <Square size={16} />
              {stopMutation.isPending ? 'Stopping…' : 'Stop Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-blue-600" />
              <h2 className="font-semibold text-slate-900">Start a New Session</h2>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Location <span className="text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Campus library, Main square…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Play size={16} />
              {startMutation.isPending ? 'Starting…' : 'Start Session'}
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: mySessions.length, icon: Calendar },
          { label: 'Total Hours', value: totalHours, icon: Clock },
          { label: 'This Month', value: mySessions.filter((s) => {
            const d = new Date(s.created_date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 text-center">
            <Icon size={18} className="mx-auto mb-2 text-blue-600" />
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Past sessions */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Past Sessions</h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : mySessions.filter((s) => s.endTime).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Calendar size={36} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No completed sessions yet</p>
            <p className="mt-1 text-xs text-slate-400">Start your first session above</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {mySessions
              .filter((s) => s.endTime)
              .map((session) => (
                <div key={session.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Clock size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {session.location || 'Evangelism session'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(session.startTime).toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {' · '}
                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {session.durationMinutes ? formatDuration(session.durationMinutes) : '—'}
                    </p>
                    {session.studentIds && session.studentIds.length > 0 && (
                      <p className="text-xs text-slate-500">{session.studentIds.length} students</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
