import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Zap, LayoutDashboard, FileText, Mic, BookOpen, Briefcase, Users,
  Settings, LogOut, Menu, ChevronRight, BarChart3, UserCircle,
  Code, Brain, Award, GraduationCap, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

const studentLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/resume-builder", icon: FileText, label: "Resume Builder" },
  { to: "/mock-interview", icon: Mic, label: "AI Interview" },
  { to: "/coding", icon: Code, label: "Coding Challenge" },
  { to: "/aptitude", icon: Brain, label: "Aptitude Test" },
  { to: "/practice", icon: BookOpen, label: "Practice" },
  { to: "/resume-generator", icon: Award, label: "Placement Resume" },
  { to: "/profile", icon: UserCircle, label: "Profile" },
];

const recruiterLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Recruiter Dashboard" },
  { to: "/recruiter/students", icon: Users, label: "Candidate List" },
  { to: "/recruiter/jobs", icon: Briefcase, label: "Job Listings" },
  { to: "/profile", icon: UserCircle, label: "Profile" },
];

const adminLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Admin Dashboard" },
  { to: "/admin/users", icon: GraduationCap, label: "Student Performance" },
  { to: "/admin/analytics", icon: BarChart3, label: "Placement Analytics" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { role, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = role === "admin" ? adminLinks : role === "recruiter" ? recruiterLinks : studentLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 p-5 border-b border-border">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg font-display font-bold text-foreground">HireReadyAI</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary glow-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-display font-semibold text-foreground capitalize">
            {links.find(l => l.to === location.pathname)?.label || "Dashboard"}
          </h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
