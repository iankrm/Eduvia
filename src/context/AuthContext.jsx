import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, setToken, get, post, patch } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` covers the initial token check only, so protected routes can
  // wait instead of flashing the signed-out state on a hard refresh.
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    get('/auth/me')
      .then((r) => {
        if (!cancelled) setUser(r.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(async (payload) => {
    const r = await post('/auth/signup', payload);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await post('/auth/login', { email, password });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout');
    } catch {
      /* token is dropped client-side regardless */
    }
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const r = await patch('/auth/me', payload);
    setUser(r.user);
    return r.user;
  }, []);

  const refresh = useCallback(async () => {
    const r = await get('/auth/me');
    setUser(r.user);
    return r.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      login,
      logout,
      updateProfile,
      refresh,
      isStudent: user?.role === 'student',
      isTutor: user?.role === 'tutor',
      // Admins keep a normal role, so this is a flag rather than a role.
      isAdmin: !!user?.is_admin,
    }),
    [user, loading, signup, login, logout, updateProfile, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
