'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { StudentDB } from '@/lib/db';
import type { Student, PipelineStage } from '@/lib/types';
import { PIPELINE_STAGES } from '@/lib/types';
import { Plus, Search, X, UserPlus } from 'lucide-react';

const PIPELINE_COLORS: Record<PipelineStage, string> = {
  'Initial Contact': 'bg-slate-100 text-slate-700',
  'Follow Up': 'bg-yellow-100 text-yellow-700',
  'Bible Study': 'bg-blue-100 text-blue-700',
  'Committed': 'bg-green-100 text-green-700',
  'Baptized': 'bg-purple-100 text-purple-700',
};

const BIBLE_STUDY_TOPICS = [
  'The Gospel', 'Repentance & Faith', 'Baptism', 'The Holy Spirit',
  'Prayer', 'The Church', 'The Word of God', 'Christian Living',
];

interface AddStudentForm {
  name: string;
  email: string;
  phone: string;
  universityName: string;
  course: string;
  statusPipeline: PipelineStage;
  notes: string;
}

const EMPTY_FORM: AddStudentForm = {
  name: '',
  email: '',
  phone: '',
  universityName: '',
  course: '',
  statusPipeline: 'Initial Contact',
  notes: '',
};

export default function StudentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<PipelineStage | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddStudentForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => StudentDB.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Student, 'id'>) => StudentDB.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.universityName || '').toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === 'all' || s.statusPipeline === filterStage;
    return matchSearch && matchStage;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    createMutation.mutate({
      ...form,
      evangelizedByUserId: user.id,
      evangelizedByChapterId: user.chapterId,
      country: user.country,
      bibleStudyTopics: BIBLE_STUDY_TOPICS.map((t) => ({ topic: t, completed: false })),
      created_date: new Date().toISOString(),
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-500">{students.length} total students tracked</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value as PipelineStage | 'all')}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Stages</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Student list */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserPlus size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No students found</p>
            <p className="mt-1 text-xs text-slate-400">
              {search || filterStage !== 'all' ? 'Try adjusting your filters' : 'Add your first student to get started'}
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_1fr_160px_120px] gap-4 border-b border-slate-100 px-6 py-3 sm:grid">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">University</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pipeline</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Added</span>
            </div>
            {filtered.map((student) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="flex flex-col gap-2 border-b border-slate-50 px-6 py-4 transition hover:bg-slate-50 sm:grid sm:grid-cols-[1fr_1fr_160px_120px] sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{student.name}</p>
                    <p className="truncate text-xs text-slate-500">{student.email || student.phone || '—'}</p>
                  </div>
                </div>
                <p className="truncate text-sm text-slate-600 sm:block">{student.universityName || '—'}</p>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${PIPELINE_COLORS[student.statusPipeline]}`}>
                  {student.statusPipeline}
                </span>
                <p className="text-xs text-slate-400">
                  {new Date(student.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Add New Student</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Student name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">University</label>
                  <input
                    type="text"
                    value={form.universityName}
                    onChange={(e) => setForm((f) => ({ ...f, universityName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="University name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Course</label>
                  <input
                    type="text"
                    value={form.course}
                    onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Course of study"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Pipeline Stage</label>
                  <select
                    value={form.statusPipeline}
                    onChange={(e) => setForm((f) => ({ ...f, statusPipeline: e.target.value as PipelineStage }))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="Any additional notes…"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
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
                  {createMutation.isPending ? 'Adding…' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
