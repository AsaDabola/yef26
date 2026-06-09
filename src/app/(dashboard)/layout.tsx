'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Newspaper,
  Target,
  UserCircle,
  UsersRound,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/sessions', label: 'Sessions', icon: Calendar },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/members', label: 'Members', icon: UsersRound },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-blue-700/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">YEF Evangelism</p>
          <p className="text-xs text-blue-200">Tracker</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
              {label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-blue-700/40 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name || 'User'}</p>
            <p className="truncate text-xs text-blue-200">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-blue-200 transition hover:bg-white/20 hover:text-white"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 bg-blue-700">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-blue-700 shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-blue-200 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-slate-900">YEF Evangelism</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
