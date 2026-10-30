import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types.ts';
import {
  api,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from '../services/api.ts';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCitizen: boolean;
  login: (email: string, password: string) => Promise<IUser>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
    city?: string;
  }) => Promise<IUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    name: string;
    phone: string;
    address?: string;
    city?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        removeStoredToken();
        setUser(null);
      }
    } catch {
      removeStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string): Promise<IUser> => {
    const res = await api.login({ email, password });
    if (res.token) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Token not received');
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
    city?: string;
  }): Promise<IUser> => {
    const res = await api.register(data);
    if (res.token) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Registration failed to return token');
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  const updateProfile = async (data: {
    name: string;
    phone: string;
    address?: string;
    city?: string;
  }) => {
    const res = await api.updateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isCitizen = user?.role === 'citizen';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isCitizen,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
