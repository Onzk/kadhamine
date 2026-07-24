import React, { createContext, useContext } from 'react';
import { useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { reportConvexError } from '@/lib/convexErrors';

interface AuthContextValue {
  user: ReturnType<typeof useQuery<typeof api.users.current>> | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.users.current);
  const { signOut: authSignOut } = useAuthActions();

  const isLoading = user === undefined;
  const isAuthenticated = user !== null && user !== undefined;

  usePushNotifications(isAuthenticated);
  usePresenceHeartbeat(isAuthenticated);

  const signOut = async () => {
    try {
      await authSignOut();
    } catch (error) {
      reportConvexError(error, 'signOut');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
