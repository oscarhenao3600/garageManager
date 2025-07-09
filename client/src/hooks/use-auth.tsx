import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Get user from token
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const login = async (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
