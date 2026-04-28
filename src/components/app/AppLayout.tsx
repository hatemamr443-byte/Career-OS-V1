import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Brain,
  Briefcase,
  Gauge,
  LogOut,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const dock = [
  { to: "/dashboard", label: "Overview", icon: Gauge },
  { to: "/jobs", label: "Job Tracker", icon: Briefcase },
  { to: "/gamification", label: "Progress", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "System signed out" });
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar / App Dock */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border/60 glass">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-border/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Career OS</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            System
          </p>
          {dock.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-foreground shadow-card"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border/60">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary shadow-glow">
              <Brain className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Career OS</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile bottom dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/60">
        <div className="grid grid-cols-4">
          {dock.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 min-w-0 pt-14 pb-20 md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
