import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { post as apiPost, setToken, setUser, getToken, getUser, removeToken, removeUser } from '@/lib/api';

export type UserRole = 'patient' | 'professional' | 'clinic_admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  tenantId?: string;
  tenantName?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rol?: UserRole) => Promise<any>;
  register: (email: string, password: string, nombre: string, rol?: UserRole) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const stored = getUser();
    const token = getToken();
    if (stored && token) return stored;
    return null;
  });

  const applySession = (data: any) => {
    setToken(data.token);
    const normalized = { ...data.user, id: String(data.user.id) };
    setUserState(normalized);
    setUser(normalized);
    return data;
  };

  const login = async (email: string, password: string, rol: UserRole = 'patient') => {
    const data = await apiPost('/auth/login', { email, password, rol });
    if (!data || !data.token) {
      throw new Error(data?.error || 'Credenciales inválidas');
    }
    return applySession(data);
  };

  const register = async (email: string, password: string, nombre: string, rol: UserRole = 'patient') => {
    const data = await apiPost('/auth/register', { email, password, nombre, rol });
    if (!data || !data.token) {
      throw new Error(data?.error || 'No se pudo registrar');
    }
    return applySession(data);
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);
  };

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
