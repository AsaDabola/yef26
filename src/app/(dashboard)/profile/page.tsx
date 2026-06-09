'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { UserDB } from '@/lib/db';
import type { UserRole } from '@/lib/types';
import { Save, User } from 'lucide-react';

const ROLE_COLORS: Record<UserRole, string> = {
  'Member': 'bg-slate-100 text-slate-700',
  'Evangelism Leader': 'bg-purple-100 text-purple-700',
  'Admin': 'bg-red-100 text-red-700',
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    name: '',
    chapterName: '',
    university: '',
    country: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || user.full_name || '',
        chapterName: user.chapterName || '',
        university: user.university || '',
        country: user.country || '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      await UserDB.update(user.id, {
        name: form.name,
        full_name: form.name,
        chapterName: form.chapterName,
        university: form.university,
        country: form.country,
      });
      await refreshUser();
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setError('');
      setTimeout(() => setSaveSuccess(false), 2500);
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    updateMutation.mutate();
  }

  const role = (user?.userRole || 'Member') as UserRole;
  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal information</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {/* Avatar + role */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{user?.name || user?.email || 'User'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[role]}`}>
              {role}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900">Edit Information</h2>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Chapter Name</label>
              <input
                type="text"
                value={form.chapterName}
                onChange={(e) => setForm((f) => ({ ...f, chapterName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. YEF Lagos Chapter"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">University</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="University name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                {saveSuccess && (
                  <span className="text-sm font-medium text-green-600">Profile saved!</span>
                )}
              </div>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                <Save size={14} />
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 font-semibold text-slate-900">Account Details</h2>
        <dl className="space-y-3">
          {[
            { label: 'Email', value: user?.email || '—' },
            { label: 'Role', value: role },
            { label: 'Member since', value: user?.created_date
              ? new Date(user.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="text-sm font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
