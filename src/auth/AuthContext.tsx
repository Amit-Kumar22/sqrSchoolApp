import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import {
  APP_ROLES,
  getProfile,
  loginUser,
  logoutUser,
  type Role,
} from '@/api/services/auth';
import { clearSession, loadSession, saveSession, saveUser, type SessionUser } from '@/auth/session';

interface AuthState {
  /** Still restoring the persisted session — hold the splash until this clears. */
  initializing: boolean;
  user: SessionUser | null;
  role: Role | null;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  /** Re-reads /v1/profile and updates the cached user (after a profile edit). */
  refreshUser: () => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Thrown on a successful login by a role that has no panel in this app. */
export class UnsupportedRoleError extends Error {
  constructor(public role: Role) {
    super(
      `The ${role.toLowerCase()} panel isn't available in the app yet. Please sign in on the web portal instead.`,
    );
    this.name = 'UnsupportedRoleError';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  // Guards against a burst of 401s (parallel screen fetches) each trying to
  // tear the session down.
  const signingOut = useRef(false);

  const dropSession = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    setAuthToken(null);
    setUser(null);
    await clearSession();
    signingOut.current = false;
  }, []);

  // Restore the persisted session once, at launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await loadSession();
      if (cancelled) return;
      if (session) {
        setAuthToken(session.token);
        setUser(session.user);
      }
      setInitializing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from any screen drops the session; the root layout's guards then
  // send the user back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void dropSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [dropSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { accessToken } = await loginUser(email.trim(), password);
    if (!accessToken) throw new Error('Login succeeded but no access token was returned.');

    // The token has to be live on the client before /v1/profile is called.
    setAuthToken(accessToken);
    try {
      const profile = await getProfile();
      if (!profile?.role) {
        throw new Error('Signed in, but your profile could not be read. Please contact your school administrator.');
      }
      if (!APP_ROLES.includes(profile.role)) {
        setAuthToken(null);
        throw new UnsupportedRoleError(profile.role);
      }
      const sessionUser: SessionUser = {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
      };

      // Persisting is a convenience (it keeps the user signed in across
      // restarts), not part of authenticating — a Keystore failure must not
      // turn a successful login into "wrong password".
      await saveSession(accessToken, sessionUser).catch(() => {});

      setUser(sessionUser);
      return sessionUser;
    } catch (err) {
      if (!(err instanceof UnsupportedRoleError)) setAuthToken(null);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    // Best-effort server-side logout — a failure here shouldn't strand the user
    // in a session they've asked to leave.
    await logoutUser().catch(() => {});
    await dropSession();
  }, [dropSession]);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile();
      const next: SessionUser = {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
      };
      setUser(next);
      await saveUser(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ initializing, user, role: user?.role ?? null, signIn, signOut, refreshUser }),
    [initializing, user, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
