import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  BookOpen, 
  Award, 
  ArrowLeft, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert,
  Loader2,
  Route as RouteIcon,
  BarChart3,
  Sliders,
  Gamepad2,
  Globe,
  Megaphone,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { logout } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    async function checkAdminAccess() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate({ to: "/login", search: { role: "admin" } });
        return;
      }

      try {
        const profile = await apiRequest<any>("/users/me");
        if (profile && profile.is_superuser) {
          setIsAdmin(true);
        } else {
          logout();
          navigate({ to: "/login", search: { role: "admin" } });
        }
      } catch (err) {
        logout();
        navigate({ to: "/login", search: { role: "admin" } });
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Authenticating Admin Session...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirecting
  }

  const navSections = [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ]
    },
    {
      title: "LEARNERS",
      items: [
        { label: "Learners Registry", href: "/admin/learners", icon: Users },
        { label: "Learning Paths", href: "/admin/learning-paths", icon: RouteIcon },
        { label: "Progress & Reports", href: "/admin/reports", icon: BarChart3 },
      ]
    },
    {
      title: "ASSESSMENT",
      items: [
        { label: "Assessment Manager", href: "/admin/assessments", icon: Sliders },
        { label: "Question Bank", href: "/admin/questions", icon: HelpCircle },
        { label: "Assessment Results", href: "/admin/results", icon: Award },
      ]
    },
    {
      title: "LEARNING",
      items: [
        { label: "Modules & Lessons", href: "/admin/modules", icon: BookOpen },
        { label: "Games & Practice", href: "/admin/games", icon: Gamepad2 },
        { label: "Languages & Coverage", href: "/admin/languages", icon: Globe },
      ]
    },
    {
      title: "COMMUNICATION",
      items: [
        { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { label: "Admin Settings", href: "/admin/settings", icon: Settings },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border py-6 px-4 justify-between overflow-y-auto">
      <div className="space-y-6">
        <div className="flex flex-col gap-2 px-2">
          <BrandLogo />
          <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded w-max mt-1">
            Admin Portal
          </span>
        </div>

        <nav className="space-y-4 pt-2">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </h3>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    to={item.href as any}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="space-y-1.5 pt-4 mt-6 border-t border-border/80 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to Home
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between border-b border-border bg-card px-6 py-4 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <BrandLogo />
            <span className="text-[9px] uppercase font-black tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 h-full flex flex-col z-50">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
