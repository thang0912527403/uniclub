import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Cookies from 'js-cookie';
import type { UserInfo, LoginResponse } from '~/cores/api/types/auth';
import { useGetUserClubInfoQuery, type ClubMembership } from '~/cores/api/userApi';
import { useGetClubRolesByClubIdQuery } from '~/cores/api/clubRoleApi';
import type { ClubRole } from '~/cores/api/types';

// ─── Context shape ─────────────────────────────────────────────
interface AuthContextType {
  user: UserInfo | null;
  memberships: ClubMembership[];
  isAdmin: boolean;
  isClubManager: boolean;
  clubManagerMembership: ClubMembership | undefined;
  /** The user's active membership (any role) */
  activeMembership: ClubMembership | undefined;
  /** The user's role name in their active club (dynamic, from backend) */
  userRoleName: string | null;
  clubId: number;
  clubRoles: ClubRole[];
  isLoading: boolean;
  login: (payload: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Hook to consume ──────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ─── Constants ────────────────────────────────────────────────
const CLUB_MANAGER_ROLES = ['Club Manager', 'ClubManager'];

// ─── Provider ─────────────────────────────────────────────────
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialise user from cookie (SSR-safe)
  const [user, setUser] = useState<UserInfo | null>(() => {
    try {
      const raw = Cookies.get('user');
      return raw ? (JSON.parse(raw) as UserInfo) : null;
    } catch {
      return null;
    }
  });

  const isAdmin = user?.role === 'Admin';

  // Fetch club memberships once when user is known
  const { data: memberships = [], isLoading: membershipsLoading } = useGetUserClubInfoQuery(
    user?.userId ?? '',
    { skip: isAdmin || !user?.userId },
  );

  // Find any active membership (priority: first active one)
  const activeMembership = memberships.find((m) => m.status === 'ACTIVE');

  const isClubManager =
    !isAdmin &&
    memberships.some(
      (m) => CLUB_MANAGER_ROLES.includes(m.roleName) && m.status === 'ACTIVE',
    );

  const clubManagerMembership = memberships.find(
    (m) => CLUB_MANAGER_ROLES.includes(m.roleName) && m.status === 'ACTIVE',
  );

  // ── User's role & club ──────────────────────────────────────
  const userRoleName = activeMembership?.roleName ?? null;
  const clubId = activeMembership?.clubId ?? 0;

  const { data: clubRoles = [] } = useGetClubRolesByClubIdQuery(clubId, {
    skip: !clubId,
  });

  // ── Login handler ────────────────────────────────────────────
  const login = useCallback((payload: LoginResponse) => {
    Cookies.set('accessToken', payload.accessToken);
    Cookies.set('refreshToken', payload.refreshToken ?? '');
    Cookies.set('user', JSON.stringify(payload.user ?? {}));
    setUser(payload.user ?? null);
  }, []);

  // ── Logout handler ───────────────────────────────────────────
  const logout = useCallback(() => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    setUser(null);
  }, []);

  // ── Sync across tabs (storage event doesn't fire for cookies,
  //    but we can listen to custom events or keep it simple) ───
  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = Cookies.get('user');
        const accessToken = Cookies.get('accessToken');
        if (raw && accessToken) {
          setUser(JSON.parse(raw) as UserInfo);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const value: AuthContextType = {
    user,
    memberships,
    isAdmin,
    isClubManager,
    clubManagerMembership,
    activeMembership,
    userRoleName,
    clubId,
    clubRoles,
    isLoading: !isAdmin && membershipsLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}