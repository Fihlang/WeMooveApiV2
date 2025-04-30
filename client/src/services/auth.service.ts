import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  isVerified: boolean;
  userType: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

// Login data
export interface LoginData {
  email: string;
  password: string;
}

// Registration data
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  userType: 'customer' | 'driver';
}

// Custom hook for authentication
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    
    setLoading(false);
  }, []);

  // Handle login
  const login = async (data: LoginData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Store user and token
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      
      setUser(response.user);
      setToken(response.token);
      
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Store user and token
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      
      setUser(response.user);
      setToken(response.token);
      
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Check if user is a driver
  const isDriver = isAuthenticated && user?.userType === 'driver';

  // Check if user is a customer
  const isCustomer = isAuthenticated && user?.userType === 'customer';

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    isDriver,
    isCustomer,
  };
}