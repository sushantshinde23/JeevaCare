import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../services/storage';
import {
  googleSignIn,
  logoutGoogle,
  initAuth,
  getAccessToken,
  testConnection,
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole, phone: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  // Google Workspace Integration
  googleUser: FirebaseUser | null;
  isGoogleConnected: boolean;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  firestoreConnected: boolean;
  updateUserPreferences: (prefs: { language?: 'en' | 'mr' | 'hi'; theme?: 'light' | 'dark' | 'system' }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'matricare_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(true);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // Default to ASHA health worker for immediate testability
    return DEMO_USERS[1];
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    testConnection().then((ok) => setFirestoreConnected(ok));

    const unsubscribe = initAuth(
      (fbUser) => {
        setGoogleUser(fbUser);
        // If user logged in via Google, enrich current user session
        setUser((prev) => {
          if (!prev) {
            return {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
              email: fbUser.email || 'user@gmail.com',
              role: 'health_worker',
              photoUrl: fbUser.photoURL || undefined,
            };
          }
          return {
            ...prev,
            email: fbUser.email || prev.email,
            name: fbUser.displayName || prev.name,
            photoUrl: fbUser.photoURL || undefined,
          };
        });
      },
      () => {
        setGoogleUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, explicitRole?: UserRole): Promise<boolean> => {
    const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setUser(matched);
      return true;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: explicitRole || 'health_worker',
    };
    setUser(newUser);
    return true;
  };

  const register = async (name: string, email: string, role: UserRole, phone: string): Promise<boolean> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      phone,
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    const demoForRole = DEMO_USERS.find((u) => u.role === newRole);
    if (demoForRole) {
      setUser({
        ...demoForRole,
        email: googleUser?.email || demoForRole.email,
        name: googleUser?.displayName || demoForRole.name,
      });
    } else if (user) {
      setUser({ ...user, role: newRole });
    } else {
      setUser({
        id: `usr-${Date.now()}`,
        name: `Demo ${newRole}`,
        email: googleUser?.email || `${newRole}@example.com`,
        role: newRole,
      });
    }
  };

  const connectGoogle = async (): Promise<boolean> => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to connect Google account:', err);
      return false;
    }
  };

  const disconnectGoogle = async () => {
    await logoutGoogle();
    setGoogleUser(null);
  };

  const updateUserPreferences = (prefs: { language?: 'en' | 'mr' | 'hi'; theme?: 'light' | 'dark' | 'system' }) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...prefs };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const role: UserRole = user?.role || 'health_worker';
  const isAuthenticated = Boolean(user);
  const isGoogleConnected = Boolean(googleUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        register,
        logout,
        switchRole,
        googleUser,
        isGoogleConnected,
        connectGoogle,
        disconnectGoogle,
        firestoreConnected,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
