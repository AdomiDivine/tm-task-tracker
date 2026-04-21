import { Link, useLocation } from "@tanstack/react-router";
import type { Tables } from "@/integrations/supabase/types";
import { LayoutDashboard, Archive, BarChart3, FolderKanban, ChevronLeft, ChevronRight, LogOut, Sun, Moon, Settings, Users } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";

interface AppSidebarProps {
  projects: Tables<"projects">[];
  selectedProject: string;
  onSelectProject: (key: string) => void;
  profile: { display_name: string; avatar_initials: string } | null;
  role: string;
  onSignOut: () => void;
  onManageProjects?: () => void;
}

export function AppSidebar({ projects, selectedProject, onSelectProject, profile, role, onSignOut, onManageProjects }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const visible = projects.filter((p) => !p.archived);

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 min-h-screen shrink-0`}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold gradient-text">TM Work OS</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Takeout Media</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          {!collapsed && <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-2 px-2">Navigation</p>}
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              location.pathname === "/" ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Link>
          <Link
            to="/archive"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              location.pathname === "/archive" ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Archive className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Archive</span>}
          </Link>
          {role === "admin" && (
            <>
              <Link
                to="/analytics"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === "/analytics" ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Team Workload</span>}
              </Link>
              <Link
                to="/users"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === "/users" ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                {!collapsed && <span>User Management</span>}
              </Link>
            </>
          )}
        </div>

        <div className="px-3 mt-6">
          {!collapsed && (
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Projects</p>
              {role === "admin" && onManageProjects && (
                <button onClick={onManageProjects} className="text-muted-foreground hover:text-primary" aria-label="Manage projects">
                  <Settings className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => onSelectProject("all")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedProject === "all" ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <FolderKanban className="w-4 h-4 shrink-0" />
            {!collapsed && <span>All Projects</span>}
          </button>
          {visible.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedProject === project.id ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <span className="text-base shrink-0">{project.icon}</span>
              {!collapsed && <span className="truncate">{project.name}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {!collapsed && profile && (
          <div className="flex items-center justify-between pt-2 border-t border-sidebar-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {profile.avatar_initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.display_name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{role}</p>
              </div>
            </div>
            <button onClick={onSignOut} className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
