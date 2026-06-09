'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { UserDB } from '@/lib/db';
import type { UserProfile, UserRole } from '@/lib/types';
import { Search, UsersRound } from 'lucide-react';

const ROLE_COLORS: Record<UserRole, string> = {
  'Member': 'bg-slate-100 text-slate-700',
  'Evangelism Leader': 'bg-purple-100 text-purple-700',
  'Admin': 'bg-red-100 text-red-700',
};

const ROLES: UserRole[] = ['Member', 'Evangelism Leader', 'Admin'];

export default function MembersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ['members'],
    queryFn: () => UserDB.list(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      UserDB.update(id, { userRole: role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });

  const isAdmin = user?.userRole === 'Admin';

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.chapterName || '').toLowerCase().includes(q)
    );
  });

  const displayName = (m: UserProfile) => m.full_name || m.name || m.email || 'Unknown';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Members</h1>
        <p className="mt-1 text-sm text-slate-500">{members.length} members in the fellowship</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Members list */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <UsersRound size={36} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              {search ? 'No members match your search' : 'No members found'}
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_1fr_1fr_160px] gap-4 border-b border-slate-100 px-6 py-3 sm:grid">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Country</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</span>
            </div>
            {filtered.map((member) => {
              const name = displayName(member);
              const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
              const role = (member.userRole || 'Member') as UserRole;
              const isSelf = member.id === user?.id;
              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-2 border-b border-slate-50 px-6 py-4 last:border-0 sm:grid sm:grid-cols-[1fr_1fr_1fr_160px] sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {initials || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                        {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                      </div>
                      <p className="truncate text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <p className="truncate text-sm text-slate-600">{member.chapterName || '—'}</p>
                  <p className="truncate text-sm text-slate-600">{member.country || '—'}</p>
                  <div>
                    {isAdmin && !isSelf ? (
                      <select
                        value={role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({ id: member.id, role: e.target.value as UserRole })
                        }
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[role]}`}>
                        {role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
