import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  User,
  X,
} from "lucide-react";
import React from "react";
import { useState } from "react";
import { ApprovalStatus } from "./backend";
import SplashScreen from "./components/SplashScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useActor } from "./hooks/useActor";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import SetupPage from "./pages/SetupPage";
import UserManagementPage from "./pages/UserManagementPage";

// ─── Global Error Boundary ───────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("BuildTrack app error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
              Please refresh the page to continue.
            </p>
            <Button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Role Badges ─────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  user: {
    label: "User",
    className: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  },
  guest: {
    label: "Viewer",
    className: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  },
};

function Nav({ onClose }: { onClose?: () => void }) {
  const { identity, userProfile, userRole, isAdmin, logout } = useAuth();
  const { actor } = useActor();
  const roleInfo = ROLE_BADGE[userRole] ?? ROLE_BADGE.guest;

  const { data: approvals } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && isAdmin,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const pendingCount = (approvals ?? []).filter(
    (a) => a.status === ApprovalStatus.pending,
  ).length;

  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-sidebar text-sidebar-foreground flex flex-col z-30">
      {/* Brand header */}
      <div className="flex flex-col items-center gap-1 px-3 py-4 border-b border-sidebar-border">
        <img
          src="/assets/uploads/11111logo-019d3aee-b013-75c5-ac84-61964c899068-1.png"
          alt="MBCL Logo"
          className="w-24 h-auto object-contain"
        />
        <span className="font-bold text-xs text-center text-sidebar-foreground leading-tight">
          Mwanza Builders Company Limited
        </span>
        <span className="text-[10px] text-yellow-500 italic text-center leading-tight">
          Quality Construction, Honest Service, Great Value.
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link
          to="/"
          data-ocid="nav.dashboard.link"
          onClick={onClose}
          activeProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-sidebar-primary text-sidebar-primary-foreground",
          }}
          inactiveProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          }}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          to="/projects"
          data-ocid="nav.projects.link"
          onClick={onClose}
          activeProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-sidebar-primary text-sidebar-primary-foreground",
          }}
          inactiveProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          }}
        >
          <FolderKanban className="w-4 h-4" />
          Projects
        </Link>
        {identity && (
          <Link
            to="/users"
            data-ocid="nav.users.link"
            onClick={onClose}
            activeProps={{
              className:
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-sidebar-primary text-sidebar-primary-foreground",
            }}
            inactiveProps={{
              className:
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            }}
          >
            <Shield className="w-4 h-4" />
            <span className="flex-1">Users</span>
            {isAdmin && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        {identity ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: "oklch(var(--sidebar-primary)/0.2)",
                  color: "oklch(var(--sidebar-primary))",
                }}
              >
                {userProfile?.name?.[0]?.toUpperCase() ?? (
                  <User className="w-3 h-3" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {userProfile?.name ?? "Anonymous"}
                </p>
                {userProfile?.email && (
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">
                    {userProfile.email}
                  </p>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleInfo.className}`}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
            <Button
              data-ocid="nav.logout.button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            data-ocid="nav.login.button"
            size="sm"
            className="w-full"
            asChild
          >
            <Link to="/login">Sign In</Link>
          </Button>
        )}
      </div>
    </aside>
  );
}

function RootLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { identity, userProfile, userRole, isLoading, logout } = useAuth();
  const roleInfo = ROLE_BADGE[userRole] ?? ROLE_BADGE.guest;

  // isLoading guard — render nothing until auth state resolves
  if (isLoading && !identity) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Nav />
      </div>

      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-sidebar text-sidebar-foreground flex items-center px-4 gap-3 md:hidden z-20 border-b border-sidebar-border">
        <button
          type="button"
          data-ocid="nav.mobile_menu.button"
          onClick={() => setMobileNavOpen(true)}
          className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-display font-bold text-sm flex-1">
          BuildTrack
        </span>
        {identity && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-sidebar-foreground/70 hidden sm:block">
              {userProfile?.name ?? ""}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleInfo.className}`}
            >
              {roleInfo.label}
            </span>
            <button
              type="button"
              data-ocid="nav.mobile_logout.button"
              onClick={logout}
              className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 bg-black/50 z-40 md:hidden cursor-default"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 z-50 md:hidden shadow-xl">
            <Nav onClose={() => setMobileNavOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      <main className="md:ml-56 flex-1 min-h-screen bg-background pt-14 md:pt-0">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

// ─── Routes ─────────────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: SetupPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: Projects,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$id",
  component: ProjectDetail,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UserManagementPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  setupRoute,
  dashboardRoute,
  projectsRoute,
  projectDetailRoute,
  usersRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {!showSplash && <RouterProvider router={router} />}
    </ErrorBoundary>
  );
}
