import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { TaskCard } from "@/components/TaskCard";
import { useAuth } from "@/hooks/use-auth";
import { useProjects, useTasks, useMembers } from "@/hooks/use-data";
import { useState, useEffect } from "react";
import { Archive as ArchiveIcon } from "lucide-react";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archive — TM Work OS" },
      { name: "description", content: "Completed tasks archive" },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { user, role, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { members } = useMembers();
  const [selectedProject, setSelectedProject] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  const doneTasks = tasks.filter((t) => t.status === "done");
  const filtered = selectedProject === "all" ? doneTasks : doneTasks.filter((t) => t.project_id === selectedProject);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar projects={projects} selectedProject={selectedProject} onSelectProject={setSelectedProject} profile={profile} role={role} onSignOut={signOut} />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <ArchiveIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Archive</h1>
            <span className="text-sm text-muted-foreground">({filtered.length} completed)</span>
          </div>
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">No completed tasks yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  members={members}
                  currentUserId={user.id}
                  isAdmin={role === "admin"}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
