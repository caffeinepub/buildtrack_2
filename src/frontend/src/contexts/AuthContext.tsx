import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
  isApproved: boolean;
  isPending: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { identity, login, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();
  const prevIdentityRef = useRef<string | null>(null);

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

  const { data: isApprovedData, isLoading: approvalLoading } = useQuery({
    queryKey: ["auth", "approved", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !!identity && !actorFetching,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const effectiveRole = identity
    ? (userRole ?? UserRole.guest)
    : UserRole.guest;
  const isAdmin = effectiveRole === UserRole.admin;
  const isUser = effectiveRole === UserRole.user;
  const isGuest = effectiveRole === UserRole.guest;
  const canWrite = isAdmin || isUser;
  const isApproved = isAdmin || (isApprovedData ?? false);
  const isPending = !!identity && !isAdmin && !isApproved;

  const isLoading =
    isInitializing ||
    actorFetching ||
    (!!identity && (profileLoading || roleLoading || approvalLoading));

  // Record login when identity first appears
  useEffect(() => {
    const principalStr = identity?.getPrincipal().toString() ?? null;
    if (
      principalStr &&
      principalStr !== prevIdentityRef.current &&
      actor &&
      !actorFetching
    ) {
      prevIdentityRef.current = principalStr;
      actor.recordLogin().catch(() => {});
    }
    if (!principalStr) {
      prevIdentityRef.current = null;
    }
  }, [identity, actor, actorFetching]);

  const refreshUser = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["auth"] });
  }, [qc]);

  const logout = useCallback(() => {
    if (actor) {
      actor.recordLogout().catch(() => {});
    }
    clear();
    qc.clear();
  }, [actor, clear, qc]);

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
      isApproved,
      isPending,
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
      isApproved,
      isPending,
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
