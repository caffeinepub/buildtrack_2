import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { FolderKanban, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import SplashScreen from "./components/SplashScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";

function Nav() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isLoggedIn = !!identity;

  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-sidebar text-sidebar-foreground flex flex-col z-30">
      {/* Brand header with logo */}
      <div className="flex flex-col items-center gap-1 px-3 py-4 border-b border-sidebar-border">
        <img
          src="/assets/uploads/11111logo-1-1.png"
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
          activeProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-sidebar-primary text-sidebar-primary-foreground",
          }}
          inactiveProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          to="/projects"
          data-ocid="nav.projects.link"
          activeProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-sidebar-primary text-sidebar-primary-foreground",
          }}
          inactiveProps={{
            className:
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <FolderKanban className="w-4 h-4" />
          Projects
        </Link>
      </nav>
      <div className="px-4 py-4 border-t border-sidebar-border">
        {isLoggedIn ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={clear}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={login}
            disabled={isLoggingIn}
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </Button>
        )}
      </div>
    </aside>
  );
}

function RootLayout() {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="ml-56 flex-1 min-h-screen bg-background">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
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

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  projectsRoute,
  projectDetailRoute,
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
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {!showSplash && <RouterProvider router={router} />}
    </>
  );
}
