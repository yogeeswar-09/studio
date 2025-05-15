"use client";

import type { User } from '@/types';
import { mockUsers } from '@/lib/mock-data';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pasword: string) => Promise<void>;
  signup: (name: string, email: string, pasword: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Simulate checking auth status
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('campusKartUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to retrieve user from localStorage", error);
        localStorage.removeItem('campusKartUser');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname?.startsWith('/auth');
      if (!user && !isAuthPage && pathname !== '/') {
        router.push('/auth/login');
      } else if (user && (isAuthPage || pathname === '/')) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);


  const login = async (email: string, _: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && email.endsWith('@mlrit.ac.in')) {
      setUser(foundUser);
      localStorage.setItem('campusKartUser', JSON.stringify(foundUser));
      router.push('/dashboard');
    } else {
      setIsLoading(false);
      throw new Error('Invalid credentials or not an MLRIT email.');
    }
    setIsLoading(false);
  };

  const signup = async (name: string, email: string, _:string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!email.endsWith('@mlrit.ac.in')) {
      setIsLoading(false);
      throw new Error('Only MLRIT email addresses are allowed.');
    }
    const newUser: User = { id: `user${mockUsers.length + 1}`, name, email, avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,2).toUpperCase()}` };
    // In a real app, this would be saved to a DB.
    // For mock, we don't add to mockUsers unless we want to persist it across sessions for demo.
    // For this demo, we'll just set the user and navigate.
    setUser(newUser); 
    localStorage.setItem('campusKartUser', JSON.stringify(newUser));
    router.push('/auth/verify-email'); // Redirect to a verify email page
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campusKartUser');
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
