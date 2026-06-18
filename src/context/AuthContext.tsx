import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = 'teachme_jwt';

// Helper to validate token expiration BEFORE setting initial state
const isTokenValid = (jwt: string): boolean => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // 1. Check validity during initialization to avoid setState-in-effect warnings
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && isTokenValid(stored)) {
      return stored;
    }
    localStorage.removeItem(TOKEN_KEY);
    return null;
  });

  const login = useCallback((jwt: string) => {
    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return (
      <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
        {children}
      </AuthContext.Provider>
  );
};

// 2. Tell Vite's Fast Refresh to safely ignore this standard export pattern
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}