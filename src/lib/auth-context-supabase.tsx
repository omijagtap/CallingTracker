"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User } from './supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isReturningUser: boolean;
  isAdmin: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  trackActivity: (userId: string, activity: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check localStorage for current session (for backward compatibility)
        const currentUser = localStorage.getItem('current_user');
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          setUser(userData);
          setIsReturningUser(true);
          setIsAdmin(userData.id === 'admin');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);

      // Try Supabase first, fallback to localStorage if it fails
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (existingUser) {
          throw new Error('User already exists with this email');
        }

        // Create new user
        const newUser = {
          id: Date.now().toString(),
          email,
          password, // In production, hash this password
          name
        };

        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (error) throw error;

        const userSession = { id: data.id, email: data.email, name: data.name };
        localStorage.setItem('current_user', JSON.stringify(userSession));
        setUser(userSession);
        setIsReturningUser(false);
        setIsAdmin(false);

        // Track registration activity
        await trackActivity(data.id, 'User Registration', { email, name });
        return;
      } catch (supabaseError) {
        console.log('Supabase registration failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      const userExists = existingUsers.find((u: any) => u.email === email);
      
      if (userExists) {
        throw new Error('User already exists with this email');
      }

      // Create new user in localStorage
      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        name
      };

      existingUsers.push(newUser);
      localStorage.setItem('app_users', JSON.stringify(existingUsers));

      const userSession = { id: newUser.id, email: newUser.email, name: newUser.name };
      localStorage.setItem('current_user', JSON.stringify(userSession));
      setUser(userSession);
      setIsReturningUser(false);
      setIsAdmin(false);

      // Track registration activity (localStorage fallback)
      await trackActivity(newUser.id, 'User Registration', { email, name });

    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Admin override login
      if (email === 'Air01' && password === 'Omkar@123') {
        const adminUser = { id: 'admin', email: 'admin@system', name: 'Admin' };
        localStorage.setItem('current_user', JSON.stringify(adminUser));
        setUser(adminUser);
        setIsReturningUser(true);
        setIsAdmin(true);
        await trackActivity('admin', 'Admin Login', { email });
        return;
      }

      // Try Supabase first, fallback to localStorage
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (!error && userData) {
          const userSession = { id: userData.id, email: userData.email, name: userData.name };
          localStorage.setItem('current_user', JSON.stringify(userSession));
          setUser(userSession);
          setIsReturningUser(true);
          setIsAdmin(userData.id === 'admin');
          await trackActivity(userData.id, 'User Login', { email });
          return;
        }
      } catch (supabaseError) {
        console.log('Supabase login failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      const userData = existingUsers.find((u: any) => u.email === email && u.password === password);

      if (!userData) {
        throw new Error('Invalid email or password');
      }

      const userSession = { id: userData.id, email: userData.email, name: userData.name };
      localStorage.setItem('current_user', JSON.stringify(userSession));
      setUser(userSession);
      setIsReturningUser(true);
      setIsAdmin(userData.id === 'admin');

      // Track login activity (localStorage fallback)
      await trackActivity(userData.id, 'User Login', { email });

    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Track logout activity
        await trackActivity(user.id, 'User Logout', {
          email: user.email,
          sessionDuration: 'Unknown'
        });
      }

      localStorage.removeItem('current_user');
      setUser(null);
      setIsReturningUser(false);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const trackActivity = async (userId: string, activity: string, details?: any) => {
    try {
      const activityData = {
        id: Date.now().toString(),
        user_id: userId,
        activity,
        details: details || {},
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };

      // Try Supabase first
      try {
        const { error } = await supabase
          .from('activities')
          .insert([activityData]);

        if (!error) {
          console.log(`Activity tracked in Supabase: ${activity} for user ${userId}`);
          return;
        }
      } catch (supabaseError) {
        console.log('Supabase activity tracking failed, using localStorage fallback');
      }

      // Fallback to localStorage
      const activities = JSON.parse(localStorage.getItem('user_activity') || '[]');
      const localActivity = { ...activityData, userId: userId }; // Keep original format for compatibility
      activities.unshift(localActivity);
      // Keep only first 100
      if (activities.length > 100) activities.splice(100);
      localStorage.setItem('user_activity', JSON.stringify(activities));
      
      console.log(`Activity tracked in localStorage: ${activity} for user ${userId}`);
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isReturningUser,
    isAdmin,
    register,
    login,
    logout,
    trackActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
