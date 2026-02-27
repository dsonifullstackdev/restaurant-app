/**
 * AuthContext — global auth state.
 * Checks stored token on app launch.
 * Wrap app in <AuthProvider> in _layout.tsx
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  clearAuth,
  getStoredToken,
  getStoredUser,
  loginWithEmail,
  registerUser,
  validateToken,
} from '@/api/services/auth.service';
import type {
  AuthUser,
  LoginWithEmailPayload,
  RegisterPayload,
} from '@/types/auth';

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;  // true while checking stored token on launch
};

type AuthContextType = AuthState & {
  login: (payload: LoginWithEmailPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Check stored token on app launch ──────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, storedUser] = await Promise.all([
          getStoredToken(),
          getStoredUser(),
        ]);

        if (token && storedUser) {
          const valid = await validateToken(token);
          if (valid) {
            setUser(storedUser);
          } else {
            await clearAuth();
            setUser(null);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (payload: LoginWithEmailPayload) => {
    const loggedInUser = await loginWithEmail(payload);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const newUser = await registerUser(payload);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
