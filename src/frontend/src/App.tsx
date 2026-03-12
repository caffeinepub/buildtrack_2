import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  FolderKanban,
  HardHat,
  LayoutDashboard,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";

function Nav() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isLoggedIn = !!identity;

  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-sidebar text-sidebar-foreground flex flex-col z-30">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <HardHat className="w-7 h-7 text-sidebar-primary" />
        <span className="font-display font-700 text-xl tracking-tight text-sidebar-foreground">
          BuildTrack
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink
          to="/"
          end
          data-ocid="nav.dashboard.link"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>
        <NavLink
          to="/projects"
          data-ocid="nav.projects.link"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          <FolderKanban className="w-4 h-4" />
          Projects
        </NavLink>
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Nav />
        <main className="ml-56 flex-1 min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </BrowserRouter>
  );
}
