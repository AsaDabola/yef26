import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/api/firebase';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Base44 had an "app public settings" check. Not needed for Firebase.
  const isLoadingPublicSettings = false;
  const authError = null;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const me = await base44.auth.me();
          setUser(me);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoadingAuth(false);
      }
    });
    return () => unsub();
  }, []);

  const logout = async (shouldRedirect = true) => {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) base44.auth.redirectToLogin();
  };

  const navigateToLogin = () => base44.auth.redirectToLogin();

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        logout,
        navigateToLogin,
        checkAppState: async () => {},
        appPublicSettings: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
