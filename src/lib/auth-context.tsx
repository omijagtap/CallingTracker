'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isReturningUser: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple local storage functions
const USERS_KEY = 'app_users';
const CURRENT_USER_KEY = 'current_user';
const USER_ACTIVITY_KEY = 'user_activity';

const getStoredUsers = (): Array<{email: string, password: string, name: string, id: string}> => {
  if (typeof window === 'undefined') return [];
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
};

const saveUser = (email: string, password: string, name: string) => {
  const users = getStoredUsers();
  const id = Date.now().toString();
  const newUser = { id, email, password, name };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { id, email, name };
};

const findUser = (email: string, password: string) => {
  const users = getStoredUsers();
  const user = users.find(u => u.email === email && u.password === password);
  return user ? { id: user.id, email: user.email, name: user.name } : null;
};

const userExists = (email: string) => {
  const users = getStoredUsers();
  return users.some(u => u.email === email);
};

// User activity tracking functions
const trackUserActivity = (userId: string, activity: string, details?: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    const activities = JSON.parse(localStorage.getItem(USER_ACTIVITY_KEY) || '[]');
    const newActivity = {
      id: Date.now().toString(),
      userId,
      activity,
      details: details || {},
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    
    // Add newest on top
    activities.unshift(newActivity);
    // Keep only first 100
    if (activities.length > 100) activities.splice(100);
    localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(activities));
    // Notify UI listeners
    try { window.dispatchEvent(new CustomEvent('storageUpdated')); } catch {}
    console.log(`Activity tracked: ${activity} for user ${userId}`);
    // Best-effort: also post activity to server API for persistence
    try {
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      }).catch((e) => console.warn('Failed to POST activity to server API', e));
    } catch (e) {
      console.warn('Activity POST error', e);
    }
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for existing session
    if (typeof window !== 'undefined') {
      try {
        const currentUser = localStorage.getItem(CURRENT_USER_KEY);
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          setUser(userData);
          setIsReturningUser(true);
          setIsAdmin(userData?.id === 'admin');
        }
      } catch (error) {
        console.error('Error loading user session:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string): Promise<User> => {
    try {
      console.log('Starting signup process...');
      
      if (userExists(email)) {
        throw new Error('This email is already registered. Please log in instead.');
      }

      const newUser = saveUser(email, password, name);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setIsReturningUser(false);

      // Persist user to server-side store (best-effort) - INCLUDE PASSWORD
      try {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: newUser.id, email: newUser.email, name: newUser.name, password: password }),
        }).catch((e) => console.warn('Failed to persist user to server API', e));
      } catch (e) {
        console.warn('User POST error', e);
      }
      // Track signup activity
      trackUserActivity(newUser.id, `${newUser.name} Account Created`, {
        email: newUser.email,
        name: newUser.name,
        browser: navigator.userAgent,
        platform: navigator.platform
      });

      return newUser;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      console.log('Starting signin process...');
      // Admin override login
      if (email === 'Air01' && password === 'Omkar@123') {
        const adminUser = { id: 'admin', email: 'admin@system', name: 'Admin' };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
        setUser(adminUser);
        setIsReturningUser(true);
        setIsAdmin(true);

        // Track login activity
        trackUserActivity(adminUser.id, `${adminUser.name} Login`, {
          email: adminUser.email,
          loginTime: new Date().toLocaleString(),
          browser: navigator.userAgent,
          platform: navigator.platform,
          isReturningUser: true,
          role: 'admin'
        });
        return adminUser;
      }
      
      // Check server users list first (admin deletions take effect)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const res = await fetch('/api/users', { 
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const serverUsers = await res.json();
          // Check if user exists on server with correct password
          const serverUser = Array.isArray(serverUsers) && serverUsers.find((u: any) => 
            (u.email || '').toLowerCase() === email.toLowerCase() && u.password === password
          );
          if (serverUser) {
            // User found on server, use server data
            const validUser = { id: serverUser.id, email: serverUser.email, name: serverUser.name };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(validUser));
            setUser(validUser);
            setIsReturningUser(true);
            setIsAdmin(validUser.id === 'admin');
            
            // Track login activity
            trackUserActivity(validUser.id, `${validUser.name} Login`, {
              email: validUser.email,
              loginTime: new Date().toLocaleString(),
              browser: navigator.userAgent,
              platform: navigator.platform,
              isReturningUser: true
            });
            
            return validUser;
          } else {
            // Check if email exists but wrong password
            const emailExists = Array.isArray(serverUsers) && serverUsers.some((u: any) => 
              (u.email || '').toLowerCase() === email.toLowerCase()
            );
            if (emailExists) {
              throw new Error('Invalid password');
            }
          }
        }
      } catch (e) {
        console.log('Server check failed, proceeding with local authentication:', e);
        // If server not reachable, proceed with local check
      }

      const foundUser = findUser(email, password);
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      setIsReturningUser(true);
      setIsAdmin(foundUser.id === 'admin');

      // Track login activity
      trackUserActivity(foundUser.id, `${foundUser.name} Login`, {
        email: foundUser.email,
        loginTime: new Date().toLocaleString(),
        browser: navigator.userAgent,
        platform: navigator.platform,
        isReturningUser: true
      });

      return foundUser;
    } catch (error: any) {
      console.error('Signin error:', error);
      throw error;
    }
  };

  const logout = () => {
    if (user) {
      // Track logout activity before clearing user
      trackUserActivity(user.id, `${user.name} Logout`, {
        email: user.email,
        logoutTime: new Date().toLocaleString(),
        sessionDuration: 'Unknown' // Could calculate if we stored login time
      });
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    setIsReturningUser(false);
    setIsAdmin(false);

    try {
      router.replace('/landing');
    } catch (e) {
      window.location.href = '/landing';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout, isReturningUser, isAdmin }}>
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