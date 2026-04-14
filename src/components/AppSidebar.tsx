import { Link, useLocation } from "@tanstack/react-router";
import type { Tables } from "@/integrations/supabase/types";
import { LayoutDashboard, Archive, BarChart3, FolderKanban, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState } from "react";

interface AppSidebarProps {
  projects: Tables<"projects">[];
  selectedProject: string;
  onSelectProject: (key: string) => void;
  profile: { display_name: string; avatar_initials: string } | null;
  role: string;
  onSignOut: () => void;
}

export function AppSidebar({ projects, selectedProject, onSelectProject, profile, role, onSignOut }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 min-h-screen`}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold gradient-text">TM</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Work OS</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        <div className="px-3 mb-2">
          {!collapsed && (
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-2 px-2">Navigation</p>
          )}
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              location.pathname === "/" ? "sidebar-item-active" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Link>
          <Link
            to="/archive"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              location.pathname === "/archive" ? "sidebar-item-active" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Archive className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Archive</span>}
          </Link>
          {role === "admin" && (
            <Link
              to="/analytics"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === "/analytics" ? "sidebar-item-active" : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Analytics</span>}
            </Link>
          )}
        </div>

        <div className="px-3 mt-6">
          {!collapsed && (
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-2 px-2">Projects</p>
          )}
          <button
            onClick={() => onSelectProject("all")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedProject === "all" ? "sidebar-item-active" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <FolderKanban className="w-4 h-4 shrink-0" />
            {!collapsed && <span>All Projects</span>}
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedProject === project.id ? "sidebar-item-active" : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <span className="text-base shrink-0">{project.icon}</span>
              {!collapsed && <span>{project.name}</span>}
            </button>
          ))}
        </div>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {profile?.avatar_initials ?? "??"}
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">{profile?.display_name ?? "User"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{role} · TM</p>
              </div>
            </div>
            <button onClick={onSignOut} className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
