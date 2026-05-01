import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Home, Newspaper, Plus, Users, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Splash from '@/components/Splash';
import { AnimatePresence, motion } from 'framer-motion';

// Evangelizing Mode Context
export const EvangelizingContext = createContext({
  isEvangelizing: false,
  sessionData: null,
  startEvangelizing: () => {},
  stopEvangelizing: () => {},
  addStudentToSession: () => {},
});

export const useEvangelizing = () => useContext(EvangelizingContext);

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isEvangelizing, setIsEvangelizing] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (!isAuthenticated) {
        // Not logged in - redirect to login
        setLoading(false);
        setShowSplash(false);
        base44.auth.redirectToLogin();
        return;
      }
      
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Check if user needs onboarding (only for new users without chapter)
      if (!userData.onboardingComplete && currentPageName !== 'Onboarding') {
        window.location.href = createPageUrl('Onboarding');
      }
    } catch (e) {
      console.error(e);
      // Auth error - redirect to login
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
      setTimeout(() => setShowSplash(false), 800);
    }
  };

  const startEvangelizing = (data) => {
    setIsEvangelizing(true);
    setSessionData({
      startTime: new Date().toISOString(),
      studentIds: [],
      notes: '',
      modeType: data?.modeType || 'Individual',
      locationName: data?.locationName || '',
      ...data
    });
  };

  const stopEvangelizing = () => {
    const endTime = new Date().toISOString();
    const result = {
      ...sessionData,
      endTime,
      durationMinutes: Math.round((new Date(endTime) - new Date(sessionData.startTime)) / 60000)
    };
    setIsEvangelizing(false);
    setSessionData(null);
    return result;
  };

  const addStudentToSession = (studentId) => {
    if (sessionData) {
      setSessionData(prev => ({
        ...prev,
        studentIds: [...(prev.studentIds || []), studentId]
      }));
    }
  };

  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'News', icon: Newspaper, page: 'News' },
    { name: 'Add', icon: Plus, page: 'Add', isCenter: true },
    { name: 'Students', icon: Users, page: 'Students' },
    { name: 'Profile', icon: User, page: 'Profile' },
  ];

  const isActive = (page) => currentPageName === page;

  // Show splash screen during initial load
  if (showSplash || loading) {
    return <Splash />;
  }

  if (currentPageName === 'Onboarding') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-slate-50"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <EvangelizingContext.Provider value={{
      isEvangelizing,
      sessionData,
      startEvangelizing,
      stopEvangelizing,
      addStudentToSession
    }}>
      <style>{`
        :root {
          --navy: #1e3a5f;
          --blue: #3b82f6;
          --light-yellow: #fef9c3;
          --white: #ffffff;
          --black: #0f172a;
        }
        .dark {
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
        }
      `}</style>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-slate-50 pb-20"
      >
        {/* Evangelizing Mode Banner */}
        {isEvangelizing && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                <span className="font-medium">Evangelizing Mode</span>
              </div>
              <Link 
                to={createPageUrl('Add')}
                className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition"
              >
                View Session
              </Link>
            </div>
          </div>
        )}

        <main className={cn("max-w-lg mx-auto", isEvangelizing && "pt-14")}>
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb">
          <div className="max-w-lg mx-auto flex items-center justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 transition-all",
                  item.isCenter && "relative -mt-6",
                )}
              >
                {item.isCenter ? (
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
                    isEvangelizing 
                      ? "bg-gradient-to-r from-red-500 to-orange-500" 
                      : "bg-gradient-to-r from-blue-600 to-indigo-600"
                  )}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <>
                    <item.icon className={cn(
                      "w-6 h-6 transition-colors",
                      isActive(item.page) ? "text-blue-600" : "text-slate-400"
                    )} />
                    <span className={cn(
                      "text-xs font-medium",
                      isActive(item.page) ? "text-blue-600" : "text-slate-500"
                    )}>
                      {item.name}
                    </span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </motion.div>
    </EvangelizingContext.Provider>
  );
}