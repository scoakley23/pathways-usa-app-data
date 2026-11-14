import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '@/api/auth';

// Who is signed in, for the whole app. Built on src/api/auth.js, so it works
// the same with Base44's login or Supabase's email code (the switch lives
// there). `sessionExpired` is true when the login ended without the learner
// signing out; App shows a small "Sign in again" notice for it.
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const checkAppState = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const result = await auth.checkSession();
      setUser(result.user);
      setAuthError(result.authError);
    } catch (error) {
      setUser(null);
      setAuthError({ type: 'unknown', message: error?.message || 'Failed to load app' });
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAppState();
    return auth.onChange((kind) => {
      if (kind === 'expired') setSessionExpired(true);
      if (kind === 'signed_in') setSessionExpired(false);
      checkAppState();
    });
  }, [checkAppState]);

  const logout = async () => {
    setUser(null);
    await auth.signOut();
  };

  const navigateToLogin = (next, reason) => auth.goToSignIn(next, reason);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      // Base44 only; kept so older callers don't break.
      isLoadingPublicSettings: false,
      authError,
      sessionExpired,
      dismissSessionExpired: () => setSessionExpired(false),
      logout,
      navigateToLogin,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
