'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { NewsDB } from '@/lib/db';
import type { NewsPost } from '@/lib/types';
import { Plus, X, Trash2, Newspaper } from 'lucide-react';

export default function NewsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery<NewsPost[]>({
    queryKey: ['news'],
    queryFn: () => NewsDB.list(),
  });

  const isLeaderOrAdmin = user?.userRole === 'Admin' || user?.userRole === 'Evangelism Leader';

  const createMutation = useMutation({
    mutationFn: (data: Omit<NewsPost, 'id'>) => NewsDB.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news'] });
      setShowModal(false);
      setTitle('');
      setBody('');
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => NewsDB.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news'] });
      setConfirmDeleteId(null);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    if (!title.trim()) { setFormError('Title is required'); return; }
    if (!body.trim()) { setFormError('Body is required'); return; }
    createMutation.mutate({
      title,
      body,
      authorId: user.id,
      authorName: user.name || user.email,
      chapterId: user.chapterId,
      global: false,
      created_date: new Date().toISOString(),
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">News</h1>
          <p className="mt-1 text-sm text-slate-500">Fellowship updates and announcements</p>
        </div>
        {isLeaderOrAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} />
            New Post
          </button>
        )}
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center ring-1 ring-slate-200">
          <Newspaper size={40} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No posts yet</p>
          {isLeaderOrAdmin && (
            <p className="mt-1 text-xs text-slate-400">Create the first post to share news with your chapter</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isOwn = post.authorId === user?.id;
            const canDelete = isOwn || user?.userRole === 'Admin';
            return (
              <article key={post.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-slate-900 leading-snug">{post.title}</h2>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{post.authorName || 'Unknown'}</span>
                      <span>·</span>
                      <time dateTime={post.created_date}>
                        {new Date(post.created_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                  {canDelete && (
                    <div className="shrink-0">
                      {confirmDeleteId === post.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">Delete?</span>
                          <button
                            onClick={() => deleteMutation.mutate(post.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{post.body}</p>
              </article>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Create News Post</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{formError}</div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Post title…"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Body *</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Write your announcement or update here…"
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
                  {createMutation.isPending ? 'Posting…' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
