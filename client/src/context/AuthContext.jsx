import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dearly_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dearly_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiRequest('/auth/me')
        .then(userData => {
          setUser(userData);
          localStorage.setItem('dearly_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('dearly_token', res.token);
    localStorage.setItem('dearly_user', JSON.stringify(res.user));
    return res;
  };

  const register = async (userData) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('dearly_token', res.token);
    localStorage.setItem('dearly_user', JSON.stringify(res.user));
    return res;
  };

  const loginDemo = async () => {
    const res = await apiRequest('/auth/demo', {
      method: 'POST'
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('dearly_token', res.token);
    localStorage.setItem('dearly_user', JSON.stringify(res.user));
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dearly_token');
    localStorage.removeItem('dearly_user');
  };

  const updatePreferences = async (newPrefs) => {
    const res = await apiRequest('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(newPrefs)
    });
    setUser(prev => {
      const updated = { ...prev, preferences: res.preferences };
      localStorage.setItem('dearly_user', JSON.stringify(updated));
      return updated;
    });
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginDemo, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
