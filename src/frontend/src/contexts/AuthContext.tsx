import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";
import { type UserProfile, UserRole } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AuthContextValue {
  identity: ReturnType<typeof useInternetIdentity>["identity"];
  userProfile: UserProfile | null;
  userRole: UserRole;
  isAdmin: boolean;
  isUser: boolean;
  isGuest: boolean;
  canWrite: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { identity, login, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["auth", "profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !!identity && !actorFetching,
    staleTime: 30_000,
  });

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["auth", "role", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !!identity && !actorFetching,
    staleTime: 30_000,
  });

  const effectiveRole = identity
    ? (userRole ?? UserRole.guest)
    : UserRole.guest;
  const isAdmin = effectiveRole === UserRole.admin;
  const isUser = effectiveRole === UserRole.user;
  const isGuest = effectiveRole === UserRole.guest;
  const canWrite = isAdmin || isUser;
  const isLoading =
    isInitializing ||
    actorFetching ||
    (!!identity && (profileLoading || roleLoading));

  const refreshUser = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["auth"] });
  }, [qc]);

  const logout = useCallback(() => {
    clear();
    qc.clear();
  }, [clear, qc]);

  const value = useMemo<AuthContextValue>(
    () => ({
      identity,
      userProfile: userProfile ?? null,
      userRole: effectiveRole,
      isAdmin,
      isUser,
      isGuest,
      canWrite,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [
      identity,
      userProfile,
      effectiveRole,
      isAdmin,
      isUser,
      isGuest,
      canWrite,
      isLoading,
      login,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
