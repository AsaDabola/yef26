'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { GoalDB } from '@/lib/db';
import type { Goal } from '@/lib/types';
import { Plus, X, Trash2, Target, Calendar } from 'lucide-react';

const GOAL_TYPE_LABELS: Record<Goal['type'], string> = {
  sessions: 'Sessions',
  students: 'Students',
  bible_studies: 'Bible Studies',
  baptisms: 'Baptisms',
};

const GOAL_TYPE_COLORS: Record<Goal['type'], string> = {
  sessions: 'bg-blue-100 text-blue-700',
  students: 'bg-emerald-100 text-emerald-700',
  bible_studies: 'bg-purple-100 text-purple-700',
  baptisms: 'bg-amber-100 text-amber-700',
};

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{current} / {target}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    type: 'students' as Goal['type'],
    targetCount: 10,
    deadline: '',
  });

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => GoalDB.list(user?.chapterId),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Goal, 'id'>) => GoalDB.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      setShowModal(false);
      setForm({ title: '', type: 'students', targetCount: 10, deadline: '' });
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => GoalDB.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      setConfirmDeleteId(null);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (form.targetCount < 1) { setFormError('Target must be at least 1'); return; }
    createMutation.mutate({
      title: form.title,
      type: form.type,
      targetCount: Number(form.targetCount),
      currentCount: 0,
      chapterId: user.chapterId,
      userId: user.id,
      deadline: form.deadline || undefined,
      created_date: new Date().toISOString(),
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goals</h1>
          <p className="mt-1 text-sm text-slate-500">Track your chapter&apos;s evangelism goals</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {/* Goals grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center ring-1 ring-slate-200">
          <Target size={40} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No goals set yet</p>
          <p className="mt-1 text-xs text-slate-400">Set your first goal to start tracking progress</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const current = goal.currentCount ?? 0;
            const pct = goal.targetCount > 0 ? Math.min((current / goal.targetCount) * 100, 100) : 0;
            const isComplete = pct >= 100;
            return (
              <div key={goal.id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all ${
                isComplete ? 'ring-green-200' : 'ring-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${GOAL_TYPE_COLORS[goal.type]}`}>
                        {GOAL_TYPE_LABELS[goal.type]}
                      </span>
                      {isComplete && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Completed!
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">{goal.title}</h3>
                    {goal.deadline && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={11} />
                        Deadline: {new Date(goal.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {confirmDeleteId === goal.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteMutation.mutate(goal.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(goal.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <ProgressBar current={current} target={goal.targetCount} />
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Add New Goal</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{formError}</div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Reach 50 new students this semester"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Goal['type'] }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {Object.entries(GOAL_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Target *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.targetCount}
                    onChange={(e) => setForm((f) => ({ ...f, targetCount: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Deadline <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
