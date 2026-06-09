'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { StudentDB } from '@/lib/db';
import type { Student, PipelineStage } from '@/lib/types';
import { PIPELINE_STAGES } from '@/lib/types';
import { ArrowLeft, Save, Trash2, User, BookOpen } from 'lucide-react';

const PIPELINE_COLORS: Record<PipelineStage, string> = {
  'Initial Contact': 'bg-slate-100 text-slate-700',
  'Follow Up': 'bg-yellow-100 text-yellow-700',
  'Bible Study': 'bg-blue-100 text-blue-700',
  'Committed': 'bg-green-100 text-green-700',
  'Baptized': 'bg-purple-100 text-purple-700',
};

const DEFAULT_TOPICS = [
  'The Gospel', 'Repentance & Faith', 'Baptism', 'The Holy Spirit',
  'Prayer', 'The Church', 'The Word of God', 'Christian Living',
];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: student, isLoading } = useQuery<Student | null>({
    queryKey: ['student', id],
    queryFn: () => StudentDB.getById(id),
  });

  const [form, setForm] = useState<Partial<Student>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        email: student.email,
        phone: student.phone,
        universityName: student.universityName,
        course: student.course,
        statusPipeline: student.statusPipeline,
        notes: student.notes,
        bibleStudyTopics: student.bibleStudyTopics?.length
          ? student.bibleStudyTopics
          : DEFAULT_TOPICS.map((t) => ({ topic: t, completed: false })),
      });
    }
  }, [student]);

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<Student>) => StudentDB.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['student', id] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => StudentDB.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      router.replace('/students');
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(form);
  }

  function toggleTopic(index: number) {
    setForm((f) => {
      const topics = [...(f.bibleStudyTopics || [])];
      topics[index] = { ...topics[index], completed: !topics[index].completed };
      return { ...f, bibleStudyTopics: topics };
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Student not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const canDelete = user?.id === student.evangelizedByUserId || user?.userRole === 'Admin';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
          <p className="text-sm text-slate-500">Student profile</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${PIPELINE_COLORS[student.statusPipeline]}`}>
          {student.statusPipeline}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Basic info */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={15} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name *</label>
              <input
                required
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">University</label>
              <input
                type="text"
                value={form.universityName || ''}
                onChange={(e) => setForm((f) => ({ ...f, universityName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Course</label>
              <input
                type="text"
                value={form.course || ''}
                onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Pipeline Stage</label>
              <select
                value={form.statusPipeline || 'Initial Contact'}
                onChange={(e) => setForm((f) => ({ ...f, statusPipeline: e.target.value as PipelineStage }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="Add notes about this student…"
            />
          </div>
        </div>

        {/* Bible study topics */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={15} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900">Bible Study Progress</h2>
            <span className="ml-auto text-xs text-slate-500">
              {form.bibleStudyTopics?.filter((t) => t.completed).length || 0} / {form.bibleStudyTopics?.length || 0} completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{
                width: form.bibleStudyTopics?.length
                  ? `${(form.bibleStudyTopics.filter((t) => t.completed).length / form.bibleStudyTopics.length) * 100}%`
                  : '0%',
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(form.bibleStudyTopics || []).map((item, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  item.completed ? 'border-blue-200 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleTopic(i)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                />
                <span className={`text-sm ${item.completed ? 'font-medium text-blue-700' : 'text-slate-700'}`}>
                  {item.topic}
                </span>
                {item.completed && (
                  <span className="ml-auto text-xs text-blue-500">Done</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          {canDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Are you sure?</span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete Student
              </button>
            )
          )}
          <div className="ml-auto flex items-center gap-3">
            {saveSuccess && (
              <span className="text-sm text-green-600 font-medium">Saved!</span>
            )}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Save size={14} />
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
